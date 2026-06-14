// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 INDEPENDENT VISITOR REPORTS SERVICE
// Manages Reg 44 Independent Visitor Reports — monthly independent person
// visits required by Children's Homes Regulations 2015 Regulation 44.
// The independent visitor inspects the home, speaks to children, reviews
// records, and produces a report with findings and recommendations.
//
// CHR 2015 Reg 44 — the registered provider must ensure that an independent
// person visits the children's home at least once a month and produces a
// report on the conduct of the home, including:
//   (a) the quality and purpose of care standard
//   (b) the children's views, wishes and feelings standard
//   (c) the education standard
//   (d) the enjoyment and achievement standard
//   (e) the health and well-being standard
//   (f) the positive relationships standard
//   (g) the protection of children standard
//   (h) the leadership and management standard
//
// Reg 44(4) — the independent person's report must include an assessment
// of the effectiveness of the home, any recommendations, and whether the
// actions from previous reports have been satisfactorily addressed.
//
// SCCIF: Well-Led — "The registered person ensures that independent
// visits are conducted monthly and acted upon promptly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Enums ─────────────────────────────────────────────────────────────────

export const VISIT_AREA_VALUES = [
  "overall_experience",
  "safeguarding",
  "health_wellbeing",
  "education_achievement",
  "positive_relationships",
  "protection_of_children",
  "leadership_management",
  "physical_environment",
  "records_documentation",
  "complaints_representations",
] as const;
export type VisitArea = (typeof VISIT_AREA_VALUES)[number];

export const FINDING_SEVERITY_VALUES = [
  "commendation",
  "minor_observation",
  "recommendation",
  "concern",
  "serious_concern",
] as const;
export type FindingSeverity = (typeof FINDING_SEVERITY_VALUES)[number];

export const ACTION_STATUS_VALUES = [
  "not_started",
  "in_progress",
  "completed",
  "escalated",
  "overdue",
] as const;
export type ActionStatus = (typeof ACTION_STATUS_VALUES)[number];

export const REPORT_STATUS_VALUES = [
  "draft",
  "submitted",
  "reviewed_by_manager",
  "actioned",
  "closed",
] as const;
export type ReportStatus = (typeof REPORT_STATUS_VALUES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface Reg44IndependentVisitorReportRow {
  id: string;
  home_id: string;
  visitor_name: string;
  visit_date: string;
  report_date: string;
  area_inspected: VisitArea;
  finding_severity: FindingSeverity;
  finding_summary: string;
  recommendation: string | null;
  action_status: ActionStatus;
  report_status: ReportStatus;
  children_spoken_to: number;
  staff_spoken_to: number;
  records_reviewed: boolean;
  previous_actions_followed_up: boolean;
  child_views_captured: boolean;
  manager_response: string | null;
  response_date: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const VISIT_AREAS: { area: VisitArea; label: string }[] = [
  { area: "overall_experience", label: "Overall Experience" },
  { area: "safeguarding", label: "Safeguarding" },
  { area: "health_wellbeing", label: "Health & Wellbeing" },
  { area: "education_achievement", label: "Education & Achievement" },
  { area: "positive_relationships", label: "Positive Relationships" },
  { area: "protection_of_children", label: "Protection of Children" },
  { area: "leadership_management", label: "Leadership & Management" },
  { area: "physical_environment", label: "Physical Environment" },
  { area: "records_documentation", label: "Records & Documentation" },
  { area: "complaints_representations", label: "Complaints & Representations" },
];

export const FINDING_SEVERITIES: { severity: FindingSeverity; label: string }[] = [
  { severity: "commendation", label: "Commendation" },
  { severity: "minor_observation", label: "Minor Observation" },
  { severity: "recommendation", label: "Recommendation" },
  { severity: "concern", label: "Concern" },
  { severity: "serious_concern", label: "Serious Concern" },
];

export const ACTION_STATUSES: { status: ActionStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "escalated", label: "Escalated" },
  { status: "overdue", label: "Overdue" },
];

export const REPORT_STATUSES: { status: ReportStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Submitted" },
  { status: "reviewed_by_manager", label: "Reviewed by Manager" },
  { status: "actioned", label: "Actioned" },
  { status: "closed", label: "Closed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across Reg 44 independent visitor report rows.
 */
export function computeReg44IndependentVisitorMetrics(
  rows: Reg44IndependentVisitorReportRow[],
): {
  total_reports: number;
  serious_concern_count: number;
  concern_count: number;
  overdue_action_count: number;
  not_started_count: number;
  children_spoken_to_rate: number;
  records_reviewed_rate: number;
  previous_actions_rate: number;
  child_views_rate: number;
  manager_responded_rate: number;
  severity_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_visitors: number;
} {
  const total = rows.length;

  // Severity counts
  const seriousConcernCount = rows.filter(
    (r) => r.finding_severity === "serious_concern",
  ).length;
  const concernCount = rows.filter(
    (r) => r.finding_severity === "concern",
  ).length;

  // Action status counts
  const overdueActionCount = rows.filter(
    (r) => r.action_status === "overdue",
  ).length;
  const notStartedCount = rows.filter(
    (r) => r.action_status === "not_started",
  ).length;

  // Rate calculations — percentage with 1 decimal place
  const childrenSpokenToRate =
    total > 0
      ? Math.round(
          (rows.filter((r) => r.children_spoken_to > 0).length / total) * 1000,
        ) / 10
      : 0;

  const recordsReviewedRate =
    total > 0
      ? Math.round(
          (rows.filter((r) => r.records_reviewed).length / total) * 1000,
        ) / 10
      : 0;

  const previousActionsRate =
    total > 0
      ? Math.round(
          (rows.filter((r) => r.previous_actions_followed_up).length / total) *
            1000,
        ) / 10
      : 0;

  const childViewsRate =
    total > 0
      ? Math.round(
          (rows.filter((r) => r.child_views_captured).length / total) * 1000,
        ) / 10
      : 0;

  const managerRespondedRate =
    total > 0
      ? Math.round(
          (rows.filter(
            (r) =>
              r.manager_response !== null && r.manager_response.trim() !== "",
          ).length /
            total) *
            1000,
        ) / 10
      : 0;

  // Severity breakdown
  const severityBreakdown: Record<string, number> = {};
  for (const r of rows) {
    severityBreakdown[r.finding_severity] =
      (severityBreakdown[r.finding_severity] ?? 0) + 1;
  }

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) {
    statusBreakdown[r.report_status] =
      (statusBreakdown[r.report_status] ?? 0) + 1;
  }

  // Unique visitors
  const uniqueVisitors = new Set(rows.map((r) => r.visitor_name)).size;

  return {
    total_reports: total,
    serious_concern_count: seriousConcernCount,
    concern_count: concernCount,
    overdue_action_count: overdueActionCount,
    not_started_count: notStartedCount,
    children_spoken_to_rate: childrenSpokenToRate,
    records_reviewed_rate: recordsReviewedRate,
    previous_actions_rate: previousActionsRate,
    child_views_rate: childViewsRate,
    manager_responded_rate: managerRespondedRate,
    severity_breakdown: severityBreakdown,
    status_breakdown: statusBreakdown,
    unique_visitors: uniqueVisitors,
  };
}

/**
 * Identify Reg 44 independent visitor compliance alerts requiring attention.
 */
export function computeReg44IndependentVisitorAlerts(
  rows: Reg44IndependentVisitorReportRow[],
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

  // Critical: serious_concern with action not completed
  for (const r of rows) {
    if (
      r.finding_severity === "serious_concern" &&
      r.action_status !== "completed"
    ) {
      alerts.push({
        type: "serious_concern_not_actioned",
        severity: "critical",
        message: `Serious concern raised by independent visitor on ${r.visit_date} in area "${r.area_inspected}" has not been completed — immediate action required`,
        record_id: r.id,
      });
    }
  }

  // High: overdue actions exist
  const overdueRows = rows.filter((r) => r.action_status === "overdue");
  for (const r of overdueRows) {
    alerts.push({
      type: "overdue_action",
      severity: "high",
      message: `Reg 44 action from visit on ${r.visit_date} is overdue — finding: "${r.finding_summary}"`,
      record_id: r.id,
    });
  }

  // High: child views not captured in multiple reports
  const noChildViewsRows = rows.filter((r) => !r.child_views_captured);
  if (noChildViewsRows.length > 1) {
    alerts.push({
      type: "child_views_not_captured",
      severity: "high",
      message: `Child views not captured in ${noChildViewsRows.length} Reg 44 reports — independent visitor must seek and record children's views`,
    });
  }

  // Medium: manager has not responded to submitted reports
  const submittedNoResponse = rows.filter(
    (r) =>
      r.report_status === "submitted" &&
      (r.manager_response === null || r.manager_response.trim() === ""),
  );
  for (const r of submittedNoResponse) {
    alerts.push({
      type: "manager_no_response",
      severity: "medium",
      message: `Manager has not responded to Reg 44 report from visit on ${r.visit_date} — timely response required`,
      record_id: r.id,
    });
  }

  return alerts;
}

/**
 * Generate Cara intelligence insights for Reg 44 independent visitor reports.
 */
export function generateReg44IndependentVisitorCaraInsights(
  metrics: ReturnType<typeof computeReg44IndependentVisitorMetrics>,
  alerts: ReturnType<typeof computeReg44IndependentVisitorAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (slate-themed)
  const visitorText =
    metrics.unique_visitors === 1
      ? "1 independent visitor"
      : `${metrics.unique_visitors} independent visitors`;
  insights.push(
    `[slate] ${metrics.total_reports} Reg 44 independent visitor reports recorded across ${visitorText}. ` +
      `Children spoken to in ${metrics.children_spoken_to_rate}% of visits, ` +
      `records reviewed in ${metrics.records_reviewed_rate}% of visits, ` +
      `and manager responded to ${metrics.manager_responded_rate}% of reports.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.serious_concern_count} serious concerns and ${metrics.concern_count} concerns raised. ` +
        `${metrics.overdue_action_count} overdue actions and ${metrics.not_started_count} not yet started.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.concern_count} concerns and ${metrics.serious_concern_count} serious concerns on record. ` +
        `Continue monitoring to maintain compliance.`,
    );
  }

  // Insight 3: Reflective question about independent oversight quality
  if (metrics.child_views_rate < 100) {
    insights.push(
      `[reflect] Child views were captured in ${metrics.child_views_rate}% of independent visits. ` +
        `Are there barriers preventing the independent visitor from hearing directly from every child, ` +
        `and how can the home better facilitate meaningful engagement during Reg 44 visits?`,
    );
  } else if (metrics.previous_actions_rate < 100) {
    insights.push(
      `[reflect] Previous actions were followed up in ${metrics.previous_actions_rate}% of visits. ` +
        `Is the independent visitor consistently reviewing whether prior recommendations have been ` +
        `addressed, and does the home provide sufficient evidence of progress between visits?`,
    );
  } else {
    insights.push(
      `[reflect] Independent oversight indicators are strong across all measures. ` +
        `How can the home use the independent visitor's external perspective to drive ` +
        `continuous improvement beyond minimum compliance requirements?`,
    );
  }

  return insights;
}

// ── CRUD — Reg 44 Independent Visitor Reports ────────────────────────────

/**
 * List all Reg 44 independent visitor reports for a home.
 */
export async function listReg44IndependentVisitorReports(
  homeId: string,
): Promise<ServiceResult<Reg44IndependentVisitorReportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (
    s.from("cs_reg44_independent_visitor_reports") as SB
  )
    .select("*")
    .eq("home_id", homeId)
    .order("visit_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Create a new Reg 44 independent visitor report.
 */
export async function createReg44IndependentVisitorReport(input: {
  homeId: string;
  visitorName: string;
  visitDate: string;
  reportDate: string;
  areaInspected: VisitArea;
  findingSeverity: FindingSeverity;
  findingSummary: string;
  recommendation?: string | null;
  actionStatus?: ActionStatus;
  reportStatus?: ReportStatus;
  childrenSpokenTo?: number;
  staffSpokenTo?: number;
  recordsReviewed?: boolean;
  previousActionsFollowedUp?: boolean;
  childViewsCaptured?: boolean;
  managerResponse?: string | null;
  responseDate?: string | null;
}): Promise<ServiceResult<Reg44IndependentVisitorReportRow>> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (
    s.from("cs_reg44_independent_visitor_reports") as SB
  )
    .insert({
      home_id: input.homeId,
      visitor_name: input.visitorName,
      visit_date: input.visitDate,
      report_date: input.reportDate,
      area_inspected: input.areaInspected,
      finding_severity: input.findingSeverity,
      finding_summary: input.findingSummary,
      recommendation: input.recommendation ?? null,
      action_status: input.actionStatus ?? "not_started",
      report_status: input.reportStatus ?? "draft",
      children_spoken_to: input.childrenSpokenTo ?? 0,
      staff_spoken_to: input.staffSpokenTo ?? 0,
      records_reviewed: input.recordsReviewed ?? false,
      previous_actions_followed_up: input.previousActionsFollowedUp ?? false,
      child_views_captured: input.childViewsCaptured ?? false,
      manager_response: input.managerResponse ?? null,
      response_date: input.responseDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReg44IndependentVisitorMetrics,
  computeReg44IndependentVisitorAlerts,
  generateReg44IndependentVisitorCaraInsights,
};
