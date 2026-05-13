// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATORY REPORTING SERVICE
// Generates and manages Reg 44 independent visitor reports, Reg 45 quality
// of care reviews, and other statutory reporting requirements.
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

export type ReportType =
  | "reg44" | "reg45" | "annual_review" | "ofsted_notification"
  | "serious_incident" | "schedule_5" | "schedule_6";

export type ReportStatus =
  | "draft" | "in_progress" | "review" | "approved" | "submitted" | "archived";

export type OverallRating =
  | "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface ReportSection {
  id: string;
  title: string;
  guidance: string;
  content: string;
  regulation_ref: string;
  completed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface RegulatoryReport {
  id: string;
  home_id: string;
  report_type: ReportType;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  author_id: string;
  reviewer_id: string | null;
  status: ReportStatus;
  sections: ReportSection[];
  findings: string[];
  recommendations: string[];
  overall_rating: OverallRating | null;
  submitted_to: string | null;
  submitted_date: string | null;
  next_due_date: string | null;
  version: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Section templates ──────────────────────────────────────────────────────

export const REG44_SECTIONS: Omit<ReportSection, "content" | "completed" | "reviewed_by" | "reviewed_at">[] = [
  { id: "visit_details", title: "Visit Details", guidance: "Date, duration, and type of visit", regulation_ref: "CHR2015 Reg 44(1)" },
  { id: "children_consulted", title: "Children Consulted", guidance: "Which children were spoken to privately", regulation_ref: "CHR2015 Reg 44(2)(a)" },
  { id: "staff_consulted", title: "Staff Consulted", guidance: "Staff members interviewed during the visit", regulation_ref: "CHR2015 Reg 44(2)(b)" },
  { id: "premises_inspection", title: "Premises & Environment", guidance: "Physical condition, cleanliness, safety", regulation_ref: "CHR2015 Reg 44(2)(c)" },
  { id: "records_examined", title: "Records Examined", guidance: "Log books, incident reports, medications, and other records reviewed", regulation_ref: "CHR2015 Reg 44(2)(d)" },
  { id: "safeguarding", title: "Safeguarding Arrangements", guidance: "Assessment of safeguarding practice and concerns", regulation_ref: "CHR2015 Reg 44(2)(e)" },
  { id: "complaints", title: "Complaints & Representations", guidance: "Any complaints received or observations about complaints process", regulation_ref: "CHR2015 Reg 44(2)(f)" },
  { id: "staffing", title: "Staffing & Supervision", guidance: "Assessment of staffing levels, qualifications, and supervision", regulation_ref: "CHR2015 Reg 44(2)(g)" },
  { id: "notifications", title: "Notifications & Events", guidance: "Review of notifiable events since last visit", regulation_ref: "CHR2015 Reg 44(2)(h)" },
  { id: "previous_actions", title: "Actions from Previous Visit", guidance: "Progress on recommendations from previous Reg 44 report", regulation_ref: "CHR2015 Reg 44(3)" },
  { id: "findings", title: "Findings & Observations", guidance: "Summary of key findings from this visit", regulation_ref: "CHR2015 Reg 44(4)" },
  { id: "recommendations", title: "Recommendations", guidance: "Actions required before next visit", regulation_ref: "CHR2015 Reg 44(4)" },
];

export const REG45_SECTIONS: Omit<ReportSection, "content" | "completed" | "reviewed_by" | "reviewed_at">[] = [
  { id: "introduction", title: "Introduction & Methodology", guidance: "How the review was conducted", regulation_ref: "CHR2015 Reg 45(1)" },
  { id: "statement_of_purpose", title: "Statement of Purpose Review", guidance: "Whether the home is meeting its stated aims", regulation_ref: "CHR2015 Reg 45(2)(a)" },
  { id: "quality_of_care", title: "Quality of Care", guidance: "Assessment of care quality against national minimum standards", regulation_ref: "CHR2015 Reg 45(2)(b)" },
  { id: "children_views", title: "Views of Children", guidance: "Feedback from children and young people about their care", regulation_ref: "CHR2015 Reg 45(2)(c)" },
  { id: "stakeholder_views", title: "Views of Stakeholders", guidance: "Feedback from parents, social workers, and professionals", regulation_ref: "CHR2015 Reg 45(2)(d)" },
  { id: "outcomes", title: "Outcomes for Children", guidance: "Progress in health, education, emotional wellbeing", regulation_ref: "CHR2015 Reg 45(2)(e)" },
  { id: "complaints_analysis", title: "Complaints Analysis", guidance: "Trends and learning from complaints received", regulation_ref: "CHR2015 Reg 45(2)(f)" },
  { id: "incidents_analysis", title: "Incidents & Safeguarding Analysis", guidance: "Patterns, trends, and learning from incidents", regulation_ref: "CHR2015 Reg 45(2)(g)" },
  { id: "staffing_development", title: "Staffing & Development", guidance: "Workforce stability, training, and professional development", regulation_ref: "CHR2015 Reg 45(2)(h)" },
  { id: "improvement_plan", title: "Improvement Plan", guidance: "Prioritised actions for the next review period", regulation_ref: "CHR2015 Reg 45(3)" },
];

// ── Pure functions ─────────────────────────────────────────────────────────

/**
 * Generate section templates for a given report type.
 * Returns full ReportSection[] with content initialised to empty string
 * and completed set to false.
 */
export function generateReportSections(reportType: ReportType): ReportSection[] {
  const templates = reportType === "reg44" ? REG44_SECTIONS
    : reportType === "reg45" ? REG45_SECTIONS
    : [];

  return templates.map((t) => ({
    ...t,
    content: "",
    completed: false,
    reviewed_by: null,
    reviewed_at: null,
  }));
}

export interface ReportProgress {
  total_sections: number;
  completed_sections: number;
  reviewed_sections: number;
  progress_percentage: number;
  review_percentage: number;
  ready_for_submission: boolean;
}

/**
 * Compute progress metrics for a report's sections.
 */
export function computeReportProgress(sections: ReportSection[]): ReportProgress {
  const total_sections = sections.length;
  const completed_sections = sections.filter((s) => s.completed).length;
  const reviewed_sections = sections.filter((s) => s.reviewed_by !== null).length;

  const progress_percentage = total_sections === 0 ? 0 : Math.round((completed_sections / total_sections) * 100);
  const review_percentage = total_sections === 0 ? 0 : Math.round((reviewed_sections / total_sections) * 100);

  const ready_for_submission =
    total_sections > 0 &&
    completed_sections === total_sections &&
    reviewed_sections === total_sections;

  return {
    total_sections,
    completed_sections,
    reviewed_sections,
    progress_percentage,
    review_percentage,
    ready_for_submission,
  };
}

export interface ScheduleEntry {
  report_type: ReportType;
  due_date: string;
  days_until_due: number;
}

export interface OverdueEntry {
  report_type: ReportType;
  due_date: string;
  days_overdue: number;
}

export interface ReportingSchedule {
  upcoming: ScheduleEntry[];
  overdue: OverdueEntry[];
  last_submitted: Record<ReportType, string | null>;
}

/**
 * Compute the reporting schedule: upcoming, overdue, and last submitted dates.
 */
export function computeReportingSchedule(
  reports: { report_type: ReportType; submitted_date: string | null; next_due_date: string | null }[],
  now: Date,
): ReportingSchedule {
  const upcoming: ScheduleEntry[] = [];
  const overdue: OverdueEntry[] = [];
  const lastSubmitted: Record<string, string | null> = {};

  const nowMs = now.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  // Build last_submitted map
  for (const r of reports) {
    if (r.submitted_date) {
      const existing = lastSubmitted[r.report_type];
      if (!existing || r.submitted_date > existing) {
        lastSubmitted[r.report_type] = r.submitted_date;
      }
    } else if (!(r.report_type in lastSubmitted)) {
      lastSubmitted[r.report_type] = null;
    }
  }

  // Build upcoming and overdue lists from next_due_date
  const seenDueDates = new Set<string>();
  for (const r of reports) {
    if (!r.next_due_date) continue;

    const key = `${r.report_type}:${r.next_due_date}`;
    if (seenDueDates.has(key)) continue;
    seenDueDates.add(key);

    const dueMs = new Date(r.next_due_date).getTime();
    const diffDays = Math.round((dueMs - nowMs) / msPerDay);

    if (diffDays < 0) {
      overdue.push({
        report_type: r.report_type,
        due_date: r.next_due_date,
        days_overdue: Math.abs(diffDays),
      });
    } else {
      upcoming.push({
        report_type: r.report_type,
        due_date: r.next_due_date,
        days_until_due: diffDays,
      });
    }
  }

  // Sort upcoming by soonest first, overdue by most overdue first
  upcoming.sort((a, b) => a.days_until_due - b.days_until_due);
  overdue.sort((a, b) => b.days_overdue - a.days_overdue);

  return {
    upcoming,
    overdue,
    last_submitted: lastSubmitted as Record<ReportType, string | null>,
  };
}

export interface ReportingCompliance {
  reg44_compliant: boolean;
  reg45_compliant: boolean;
  reg44_count_12_months: number;
  reg45_count_12_months: number;
  compliance_rating: "compliant" | "partially_compliant" | "non_compliant";
}

/**
 * Assess regulatory compliance based on submitted reports.
 * Reg 44: at least one submitted per calendar month.
 * Reg 45: at least one submitted per 6 months.
 */
export function computeReportingCompliance(
  reports: { report_type: ReportType; submitted_date: string | null; status: ReportStatus }[],
  now: Date,
): ReportingCompliance {
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const submitted = reports.filter((r) => r.status === "submitted" && r.submitted_date);

  // Reg 44 reports in last 12 months
  const reg44Reports = submitted.filter(
    (r) => r.report_type === "reg44" && new Date(r.submitted_date!) >= twelveMonthsAgo,
  );
  const reg44_count_12_months = reg44Reports.length;

  // Reg 45 reports in last 12 months
  const reg45Reports = submitted.filter(
    (r) => r.report_type === "reg45" && new Date(r.submitted_date!) >= twelveMonthsAgo,
  );
  const reg45_count_12_months = reg45Reports.length;

  // Reg 44 compliance: check each calendar month has at least one submitted report
  const reg44Months = new Set<string>();
  for (const r of reg44Reports) {
    const d = new Date(r.submitted_date!);
    reg44Months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Count how many months between twelveMonthsAgo and now
  const expectedMonths: string[] = [];
  const cursor = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + 1, 1);
  while (cursor <= now) {
    expectedMonths.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const reg44_compliant = expectedMonths.length > 0 && expectedMonths.every((m) => reg44Months.has(m));

  // Reg 45 compliance: at least one every 6 months
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const reg45InLastSix = submitted.filter(
    (r) => r.report_type === "reg45" && new Date(r.submitted_date!) >= sixMonthsAgo,
  );
  const reg45_compliant = reg45InLastSix.length >= 1;

  // Overall compliance rating
  const compliance_rating: ReportingCompliance["compliance_rating"] =
    reg44_compliant && reg45_compliant ? "compliant"
    : reg44_compliant || reg45_compliant ? "partially_compliant"
    : "non_compliant";

  return {
    reg44_compliant,
    reg45_compliant,
    reg44_count_12_months,
    reg45_count_12_months,
    compliance_rating,
  };
}

/**
 * Calculate the next due date for a report type based on last submission.
 * Reg 44 = 28 days, Reg 45 = 6 months, annual_review = 12 months.
 */
export function calculateNextDueDate(
  reportType: ReportType,
  lastSubmitted: Date,
): Date {
  const next = new Date(lastSubmitted);

  switch (reportType) {
    case "reg44":
      next.setDate(next.getDate() + 28);
      break;
    case "reg45":
      next.setMonth(next.getMonth() + 6);
      break;
    case "annual_review":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      // No standard recurrence for other report types
      next.setMonth(next.getMonth() + 3);
      break;
  }

  return next;
}

// ── Report CRUD ────────────────────────────────────────────────────────────

export async function listReports(
  homeId: string,
  opts?: {
    reportType?: ReportType;
    status?: ReportStatus;
    limit?: number;
    offset?: number;
  },
): Promise<ServiceResult<RegulatoryReport[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_regulatory_reports") as SB).select("*").eq("home_id", homeId);

  if (opts?.reportType) q = q.eq("report_type", opts.reportType);
  if (opts?.status) q = q.eq("status", opts.status);

  q = q.order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 100) - 1);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getReport(id: string): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createReport(input: {
  homeId: string;
  report_type: ReportType;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  author_id: string;
  next_due_date?: string;
  notes?: string;
}): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const sections = generateReportSections(input.report_type);

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .insert({
      home_id: input.homeId,
      report_type: input.report_type,
      title: input.title,
      reporting_period_start: input.reporting_period_start,
      reporting_period_end: input.reporting_period_end,
      author_id: input.author_id,
      reviewer_id: null,
      status: "draft",
      sections,
      findings: [],
      recommendations: [],
      overall_rating: null,
      submitted_to: null,
      submitted_date: null,
      next_due_date: input.next_due_date ?? null,
      version: 1,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReport(
  id: string,
  updates: Partial<Pick<RegulatoryReport,
    | "title" | "reporting_period_start" | "reporting_period_end"
    | "status" | "findings" | "recommendations" | "overall_rating"
    | "next_due_date" | "notes" | "version"
  >>,
): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReportSection(
  reportId: string,
  sectionId: string,
  content: string,
  reviewedBy?: string,
): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Fetch existing report to update the sections array
  const { data: report, error: fetchError } = await (s.from("cs_regulatory_reports") as SB)
    .select("sections")
    .eq("id", reportId)
    .single();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!report) return { ok: false, error: "Report not found" };

  const sections: ReportSection[] = report.sections ?? [];
  const sectionIndex = sections.findIndex((sec: ReportSection) => sec.id === sectionId);
  if (sectionIndex === -1) return { ok: false, error: `Section "${sectionId}" not found` };

  sections[sectionIndex] = {
    ...sections[sectionIndex],
    content,
    completed: content.trim().length > 0,
    reviewed_by: reviewedBy ?? sections[sectionIndex].reviewed_by,
    reviewed_at: reviewedBy ? new Date().toISOString() : sections[sectionIndex].reviewed_at,
  };

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .update({ sections, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function submitReport(
  id: string,
  submittedTo: string,
): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .update({
      status: "submitted",
      submitted_to: submittedTo,
      submitted_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function approveReport(
  id: string,
  reviewerId: string,
): Promise<ServiceResult<RegulatoryReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_regulatory_reports") as SB)
    .update({
      status: "approved",
      reviewer_id: reviewerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  REG44_SECTIONS,
  REG45_SECTIONS,
  generateReportSections,
  computeReportProgress,
  computeReportingSchedule,
  computeReportingCompliance,
  calculateNextDueDate,
};
