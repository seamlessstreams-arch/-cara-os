// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 45 REPORTS SERVICE
// Manages the responsible individual's six-monthly quality of care reports
// required by CHR 2015 Reg 45. The responsible individual must visit the home
// at least twice per year (once unannounced), interview children and staff,
// and produce a report evaluating the quality of care, compliance with the
// Statement of Purpose, and the home's Reg 44 independent person reports.
//
// CHR 2015 Reg 45 — review of quality of care: the responsible individual
// must review the quality of care provided at least every 6 months, including:
//   (a) the quality and purpose of care standard (Reg 6)
//   (b) the children's views, wishes and feelings standard (Reg 7)
//   (c) compliance with the Statement of Purpose
//   (d) any actions arising from Reg 44 reports
//
// Reg 45(4) — the responsible individual must produce a written report
// evaluating quality of care, identifying areas for improvement, and
// describing any action taken or intended.
//
// Reg 45(5) — copies must be sent to Ofsted, the placing authority,
// and HMCI within 28 days.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ReportStatus =
  | "draft"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "distributed"
  | "archived";

export type VisitType =
  | "announced"
  | "unannounced";

export type QualityRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

export type ActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type ActionStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "overdue";

export type EvaluationArea =
  | "quality_of_care"
  | "children_views"
  | "statement_of_purpose"
  | "education"
  | "health"
  | "safeguarding"
  | "positive_relationships"
  | "protection_of_children"
  | "leadership_management"
  | "reg44_actions"
  | "complaints"
  | "staffing"
  | "premises"
  | "record_keeping";

export interface Reg45Report {
  id: string;
  home_id: string;
  report_period_start: string;
  report_period_end: string;
  responsible_individual: string;
  visit_dates: string[];
  visit_types: VisitType[];
  children_interviewed: string[];
  staff_interviewed: string[];
  overall_quality_rating: QualityRating;
  evaluations: {
    area: EvaluationArea;
    rating: QualityRating;
    findings: string;
    recommendations: string;
  }[];
  reg44_reports_reviewed: number;
  reg44_actions_outstanding: number;
  statement_of_purpose_compliant: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  key_strengths: string[];
  areas_for_improvement: string[];
  status: ReportStatus;
  approved_by: string | null;
  approval_date: string | null;
  distribution_date: string | null;
  ofsted_sent: boolean;
  placing_authority_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reg45Action {
  id: string;
  home_id: string;
  report_id: string;
  action_description: string;
  evaluation_area: EvaluationArea;
  priority: ActionPriority;
  assigned_to: string;
  due_date: string;
  status: ActionStatus;
  completion_date: string | null;
  completion_notes: string | null;
  evidence_reference: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REPORT_STATUSES: { status: ReportStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "in_progress", label: "In Progress" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "approved", label: "Approved" },
  { status: "distributed", label: "Distributed" },
  { status: "archived", label: "Archived" },
];

export const VISIT_TYPES: { type: VisitType; label: string }[] = [
  { type: "announced", label: "Announced" },
  { type: "unannounced", label: "Unannounced" },
];

export const QUALITY_RATINGS: { rating: QualityRating; label: string }[] = [
  { rating: "outstanding", label: "Outstanding" },
  { rating: "good", label: "Good" },
  { rating: "requires_improvement", label: "Requires Improvement" },
  { rating: "inadequate", label: "Inadequate" },
];

export const ACTION_PRIORITIES: { priority: ActionPriority; label: string }[] = [
  { priority: "critical", label: "Critical" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

export const ACTION_STATUSES: { status: ActionStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "overdue", label: "Overdue" },
];

export const EVALUATION_AREAS: { area: EvaluationArea; label: string }[] = [
  { area: "quality_of_care", label: "Quality & Purpose of Care (Reg 6)" },
  { area: "children_views", label: "Children's Views, Wishes & Feelings (Reg 7)" },
  { area: "statement_of_purpose", label: "Statement of Purpose Compliance (Reg 16)" },
  { area: "education", label: "Education (Reg 8)" },
  { area: "health", label: "Health & Wellbeing (Reg 10)" },
  { area: "safeguarding", label: "Safeguarding (Reg 12)" },
  { area: "positive_relationships", label: "Positive Relationships (Reg 11)" },
  { area: "protection_of_children", label: "Protection of Children (Reg 12)" },
  { area: "leadership_management", label: "Leadership & Management (Reg 13)" },
  { area: "reg44_actions", label: "Reg 44 Report Actions" },
  { area: "complaints", label: "Complaints & Representations (Reg 39)" },
  { area: "staffing", label: "Staffing (Reg 32)" },
  { area: "premises", label: "Premises (Reg 25)" },
  { area: "record_keeping", label: "Record Keeping (Reg 37)" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across Reg 45 reports and actions.
 */
export function computeReg45Metrics(
  reports: Reg45Report[],
  actions: Reg45Action[],
): {
  total_reports: number;
  reports_this_year: number;
  latest_overall_rating: QualityRating | null;
  open_actions: number;
  overdue_actions: number;
  completed_actions: number;
  by_quality_rating: Record<string, number>;
  by_evaluation_area: Record<string, number>;
  avg_days_to_distribute: number | null;
  next_report_due: string | null;
} {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Reports this year
  const reportsThisYear = reports.filter(
    (r) => new Date(r.report_period_end) >= yearStart,
  ).length;

  // Latest overall rating
  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.report_period_end).getTime() -
      new Date(a.report_period_end).getTime(),
  );
  const latestOverallRating =
    sortedReports.length > 0
      ? sortedReports[0].overall_quality_rating
      : null;

  // Action counts
  let openActions = 0;
  let overdueActions = 0;
  let completedActions = 0;
  for (const a of actions) {
    if (a.status === "open" || a.status === "in_progress") openActions++;
    if (a.status === "overdue") overdueActions++;
    if (a.status === "completed") completedActions++;
  }

  // By quality rating (across all evaluations in all reports)
  const byQualityRating: Record<string, number> = {};
  for (const r of reports) {
    for (const e of r.evaluations) {
      byQualityRating[e.rating] = (byQualityRating[e.rating] ?? 0) + 1;
    }
  }

  // Actions by evaluation area
  const byEvaluationArea: Record<string, number> = {};
  for (const a of actions) {
    byEvaluationArea[a.evaluation_area] =
      (byEvaluationArea[a.evaluation_area] ?? 0) + 1;
  }

  // Average days from approval to distribution
  let totalDistDays = 0;
  let distCount = 0;
  for (const r of reports) {
    if (r.approval_date && r.distribution_date) {
      const days =
        (new Date(r.distribution_date).getTime() -
          new Date(r.approval_date).getTime()) /
        86400000;
      totalDistDays += days;
      distCount++;
    }
  }
  const avgDaysToDistribute =
    distCount > 0 ? Math.round((totalDistDays / distCount) * 10) / 10 : null;

  // Next report due: 6 months after the latest report period end
  let nextReportDue: string | null = null;
  if (sortedReports.length > 0) {
    const latestEnd = new Date(sortedReports[0].report_period_end);
    latestEnd.setMonth(latestEnd.getMonth() + 6);
    nextReportDue = latestEnd.toISOString().split("T")[0];
  }

  return {
    total_reports: reports.length,
    reports_this_year: reportsThisYear,
    latest_overall_rating: latestOverallRating,
    open_actions: openActions,
    overdue_actions: overdueActions,
    completed_actions: completedActions,
    by_quality_rating: byQualityRating,
    by_evaluation_area: byEvaluationArea,
    avg_days_to_distribute: avgDaysToDistribute,
    next_report_due: nextReportDue,
  };
}

/**
 * Identify Reg 45 compliance alerts requiring management attention.
 */
export function identifyReg45Alerts(
  reports: Reg45Report[],
  actions: Reg45Action[],
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

  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;

  // Sort reports by period end desc
  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.report_period_end).getTime() -
      new Date(a.report_period_end).getTime(),
  );

  // ── Report-level alerts ──────────────────────────────────────────────

  // No report in last 6 months — critical
  if (sortedReports.length > 0) {
    const latestEnd = new Date(sortedReports[0].report_period_end);
    if (now.getTime() - latestEnd.getTime() > sixMonthsMs) {
      const monthsOverdue = Math.round(
        (now.getTime() - latestEnd.getTime()) / (30 * 86400000),
      );
      alerts.push({
        type: "report_overdue",
        severity: "critical",
        message: `Reg 45 quality of care report is ${monthsOverdue} months overdue — responsible individual must review at least every 6 months`,
        id: sortedReports[0].id,
      });
    }
  }

  for (const r of reports) {
    // Report not distributed within 28 days of approval — high
    if (
      r.status === "approved" &&
      r.approval_date &&
      !r.distribution_date
    ) {
      const daysSinceApproval = Math.round(
        -londonDayDiff(r.approval_date, now),
      );
      if (daysSinceApproval > 28) {
        alerts.push({
          type: "distribution_overdue",
          severity: "high",
          message: `Reg 45 report approved ${daysSinceApproval} days ago but not distributed — Reg 45(5) requires distribution within 28 days`,
          id: r.id,
        });
      }
    }

    // Distributed but Ofsted not notified — critical
    if (r.status === "distributed" && !r.ofsted_sent) {
      alerts.push({
        type: "ofsted_not_sent",
        severity: "critical",
        message: `Reg 45 report distributed but not sent to Ofsted — Reg 45(5) requires a copy to HMCI`,
        id: r.id,
      });
    }

    // Distributed but placing authority not sent — high
    if (r.status === "distributed" && !r.placing_authority_sent) {
      alerts.push({
        type: "placing_authority_not_sent",
        severity: "high",
        message: `Reg 45 report distributed but not sent to placing authority — Reg 45(5) requires copies to relevant persons`,
        id: r.id,
      });
    }

    // No unannounced visit recorded — high
    if (
      (r.status === "approved" || r.status === "distributed") &&
      !r.visit_types.includes("unannounced")
    ) {
      alerts.push({
        type: "no_unannounced_visit",
        severity: "high",
        message: `Reg 45 report for period ${r.report_period_start} to ${r.report_period_end} does not include an unannounced visit — at least one unannounced visit required`,
        id: r.id,
      });
    }

    // No children interviewed — high
    if (
      (r.status === "approved" || r.status === "distributed") &&
      r.children_interviewed.length === 0
    ) {
      alerts.push({
        type: "no_children_interviewed",
        severity: "high",
        message: `No children interviewed for Reg 45 report — responsible individual must seek children's views`,
        id: r.id,
      });
    }

    // Inadequate overall rating — critical
    if (r.overall_quality_rating === "inadequate") {
      alerts.push({
        type: "inadequate_rating",
        severity: "critical",
        message: `Reg 45 report rated overall quality as inadequate — immediate improvement action required`,
        id: r.id,
      });
    }

    // Requires improvement — high
    if (r.overall_quality_rating === "requires_improvement") {
      alerts.push({
        type: "requires_improvement_rating",
        severity: "high",
        message: `Reg 45 report rated overall quality as requires improvement — improvement actions should be tracked`,
        id: r.id,
      });
    }

    // Statement of purpose non-compliant — high
    if (
      (r.status === "approved" || r.status === "distributed") &&
      r.statement_of_purpose_compliant !== true
    ) {
      alerts.push({
        type: "sop_non_compliant",
        severity: "high",
        message: r.statement_of_purpose_compliant === false
          ? `Reg 45 report identified non-compliance with Statement of Purpose — Reg 16 requires adherence`
          : `Reg 45 report has no Statement-of-Purpose compliance recorded — confirm and evidence adherence per Reg 16`,
        id: r.id,
      });
    }

    // Draft report older than 30 days — medium
    if (r.status === "draft") {
      const createdDate = new Date(r.created_at).getTime();
      if (now.getTime() - createdDate > 30 * 86400000) {
        alerts.push({
          type: "draft_stale",
          severity: "medium",
          message: `Reg 45 report has been in draft status for over 30 days — progress to completion`,
          id: r.id,
        });
      }
    }
  }

  // ── Action-level alerts ──────────────────────────────────────────────

  for (const a of actions) {
    // Overdue action — high
    if (
      (a.status === "open" || a.status === "in_progress") &&
      new Date(a.due_date) < now
    ) {
      const daysOverdue = Math.round(
        -londonDayDiff(a.due_date, now),
      );
      alerts.push({
        type: "action_overdue",
        severity: a.priority === "critical" ? "critical" : "high",
        message: `Reg 45 action "${a.action_description}" is ${daysOverdue} days overdue — assigned to ${a.assigned_to}`,
        id: a.id,
      });
    }

    // Critical priority action not in progress — critical
    if (a.priority === "critical" && a.status === "open") {
      alerts.push({
        type: "critical_action_not_started",
        severity: "critical",
        message: `Critical Reg 45 action "${a.action_description}" has not been started — immediate attention required`,
        id: a.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Reg 45 Reports ─────────────────────────────────────────────

export async function listReports(
  homeId: string,
  filters?: {
    status?: ReportStatus;
    qualityRating?: QualityRating;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<Reg45Report[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_reg45_reports") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.qualityRating) q = q.eq("overall_quality_rating", filters.qualityRating);
  if (filters?.dateFrom) q = q.gte("report_period_start", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("report_period_end", filters.dateTo);
  q = q.order("report_period_end", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReport(
  input: {
    homeId: string;
    reportPeriodStart: string;
    reportPeriodEnd: string;
    responsibleIndividual: string;
    visitDates?: string[];
    visitTypes?: VisitType[];
    childrenInterviewed?: string[];
    staffInterviewed?: string[];
    overallQualityRating?: QualityRating;
    evaluations?: {
      area: EvaluationArea;
      rating: QualityRating;
      findings: string;
      recommendations: string;
    }[];
    reg44ReportsReviewed?: number;
    reg44ActionsOutstanding?: number;
    statementOfPurposeCompliant?: boolean;
    keyStrengths?: string[];
    areasForImprovement?: string[];
    notes?: string;
  },
): Promise<ServiceResult<Reg45Report>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_reg45_reports") as SB)
    .insert({
      home_id: input.homeId,
      report_period_start: input.reportPeriodStart,
      report_period_end: input.reportPeriodEnd,
      responsible_individual: input.responsibleIndividual,
      visit_dates: input.visitDates ?? [],
      visit_types: input.visitTypes ?? [],
      children_interviewed: input.childrenInterviewed ?? [],
      staff_interviewed: input.staffInterviewed ?? [],
      overall_quality_rating: input.overallQualityRating ?? "good",
      evaluations: input.evaluations ?? [],
      reg44_reports_reviewed: input.reg44ReportsReviewed ?? 0,
      reg44_actions_outstanding: input.reg44ActionsOutstanding ?? 0,
      statement_of_purpose_compliant: input.statementOfPurposeCompliant ?? null,
      key_strengths: input.keyStrengths ?? [],
      areas_for_improvement: input.areasForImprovement ?? [],
      status: "draft",
      approved_by: null,
      approval_date: null,
      distribution_date: null,
      ofsted_sent: false,
      placing_authority_sent: false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReport(
  id: string,
  updates: Partial<Reg45Report>,
): Promise<ServiceResult<Reg45Report>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_reg45_reports") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Reg 45 Actions ─────────────────────────────────────────────

export async function listActions(
  homeId: string,
  filters?: {
    reportId?: string;
    status?: ActionStatus;
    priority?: ActionPriority;
    evaluationArea?: EvaluationArea;
    limit?: number;
  },
): Promise<ServiceResult<Reg45Action[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_reg45_actions") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.reportId) q = q.eq("report_id", filters.reportId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.priority) q = q.eq("priority", filters.priority);
  if (filters?.evaluationArea) q = q.eq("evaluation_area", filters.evaluationArea);
  q = q.order("due_date", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAction(
  input: {
    homeId: string;
    reportId: string;
    actionDescription: string;
    evaluationArea: EvaluationArea;
    priority?: ActionPriority;
    assignedTo: string;
    dueDate: string;
    notes?: string;
  },
): Promise<ServiceResult<Reg45Action>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_reg45_actions") as SB)
    .insert({
      home_id: input.homeId,
      report_id: input.reportId,
      action_description: input.actionDescription,
      evaluation_area: input.evaluationArea,
      priority: input.priority ?? "medium",
      assigned_to: input.assignedTo,
      due_date: input.dueDate,
      status: "open",
      completion_date: null,
      completion_notes: null,
      evidence_reference: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAction(
  id: string,
  updates: Partial<Reg45Action>,
): Promise<ServiceResult<Reg45Action>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_reg45_actions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReg45Metrics,
  identifyReg45Alerts,
};
