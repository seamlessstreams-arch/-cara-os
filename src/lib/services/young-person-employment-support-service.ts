// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON EMPLOYMENT SUPPORT SERVICE
// Work readiness assessment, employment applications, interview preparation,
// apprenticeship support, supported employment. Helps care leavers prepare
// for work and achieve economic wellbeing.
// CHR 2015 Reg 9 (quality of care — helping children achieve economic wellbeing),
// CHR 2015 Reg 5 (engaging with education, training, employment),
// Children Act 1989 s.23C (continuing care and leaving care).
//
// Covers: CV preparation, interview skills, apprenticeship, work experience,
// supported employment, job search, volunteering, self-employment,
// career guidance, workplace mentoring.
//
// SCCIF: Education, Skills & Work — "Children are helped to succeed in
// education, training and work."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const SUPPORT_TYPES = [
  "cv_preparation",
  "interview_skills",
  "apprenticeship",
  "work_experience",
  "supported_employment",
  "job_search",
  "volunteering",
  "self_employment",
  "career_guidance",
  "workplace_mentoring",
] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const EMPLOYMENT_STATUSES = [
  "not_in_employment",
  "job_searching",
  "interview_stage",
  "offered",
  "employed_part_time",
  "employed_full_time",
  "apprenticeship_active",
  "self_employed",
  "volunteering",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const READINESS_LEVELS = [
  "not_ready",
  "developing",
  "work_ready",
  "employed",
  "sustained_employment",
] as const;
export type ReadinessLevel = (typeof READINESS_LEVELS)[number];

export const PROGRESS_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "ongoing",
  "withdrawn",
] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface YoungPersonEmploymentSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  support_date: string;
  support_type: SupportType;
  employment_status: EmploymentStatus;
  readiness_level: ReadinessLevel;
  progress_status: ProgressStatus;
  cv_completed: boolean;
  interview_practice_done: boolean;
  work_experience_arranged: boolean;
  employer_engaged: boolean;
  child_motivated: boolean;
  financial_literacy_covered: boolean;
  travel_training_completed: boolean;
  workplace_rights_covered: boolean;
  support_worker: string | null;
  employer_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listYoungPersonEmploymentSupport(
  homeId: string,
): Promise<ServiceResult<YoungPersonEmploymentSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_young_person_employment_support") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("support_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createYoungPersonEmploymentSupport(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  supportDate: string;
  supportType: SupportType;
  employmentStatus: EmploymentStatus;
  readinessLevel: ReadinessLevel;
  progressStatus: ProgressStatus;
  cvCompleted: boolean;
  interviewPracticeDone: boolean;
  workExperienceArranged: boolean;
  employerEngaged: boolean;
  childMotivated: boolean;
  financialLiteracyCovered: boolean;
  travelTrainingCompleted: boolean;
  workplaceRightsCovered: boolean;
  supportWorker?: string | null;
  employerName?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<YoungPersonEmploymentSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_young_person_employment_support") as any)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      support_date: input.supportDate,
      support_type: input.supportType,
      employment_status: input.employmentStatus,
      readiness_level: input.readinessLevel,
      progress_status: input.progressStatus,
      cv_completed: input.cvCompleted,
      interview_practice_done: input.interviewPracticeDone,
      work_experience_arranged: input.workExperienceArranged,
      employer_engaged: input.employerEngaged,
      child_motivated: input.childMotivated,
      financial_literacy_covered: input.financialLiteracyCovered,
      travel_training_completed: input.travelTrainingCompleted,
      workplace_rights_covered: input.workplaceRightsCovered,
      support_worker: input.supportWorker ?? null,
      employer_name: input.employerName ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEmploymentSupportMetrics(
  rows: YoungPersonEmploymentSupportRow[],
): {
  total_records: number;
  not_in_employment_count: number;
  employed_count: number;
  apprenticeship_count: number;
  not_ready_count: number;
  cv_completed_rate: number;
  interview_practice_rate: number;
  work_experience_rate: number;
  employer_engaged_rate: number;
  child_motivated_rate: number;
  financial_literacy_rate: number;
  travel_training_rate: number;
  workplace_rights_rate: number;
  support_type_breakdown: Record<string, number>;
  employment_status_breakdown: Record<string, number>;
  unique_children: number;
} {
  const total = rows.length;

  const notInEmployment = rows.filter((r) => r.employment_status === "not_in_employment").length;
  const employed = rows.filter(
    (r) =>
      r.employment_status === "employed_part_time" ||
      r.employment_status === "employed_full_time",
  ).length;
  const apprenticeship = rows.filter((r) => r.employment_status === "apprenticeship_active").length;
  const notReady = rows.filter((r) => r.readiness_level === "not_ready").length;

  const boolRate = (field: keyof YoungPersonEmploymentSupportRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const supportTypeBreakdown: Record<string, number> = {};
  for (const r of rows) supportTypeBreakdown[r.support_type] = (supportTypeBreakdown[r.support_type] ?? 0) + 1;

  const employmentStatusBreakdown: Record<string, number> = {};
  for (const r of rows) employmentStatusBreakdown[r.employment_status] = (employmentStatusBreakdown[r.employment_status] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_records: total,
    not_in_employment_count: notInEmployment,
    employed_count: employed,
    apprenticeship_count: apprenticeship,
    not_ready_count: notReady,
    cv_completed_rate: boolRate("cv_completed"),
    interview_practice_rate: boolRate("interview_practice_done"),
    work_experience_rate: boolRate("work_experience_arranged"),
    employer_engaged_rate: boolRate("employer_engaged"),
    child_motivated_rate: boolRate("child_motivated"),
    financial_literacy_rate: boolRate("financial_literacy_covered"),
    travel_training_rate: boolRate("travel_training_completed"),
    workplace_rights_rate: boolRate("workplace_rights_covered"),
    support_type_breakdown: supportTypeBreakdown,
    employment_status_breakdown: employmentStatusBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeEmploymentSupportAlerts(
  rows: YoungPersonEmploymentSupportRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: child not in employment AND not ready AND no support in progress
  for (const r of rows) {
    if (
      r.employment_status === "not_in_employment" &&
      r.readiness_level === "not_ready" &&
      r.progress_status !== "in_progress"
    ) {
      alerts.push({
        type: "not_employed_not_ready_no_support",
        severity: "critical",
        message: `${r.child_name} is not in employment, not work ready, and has no active support in progress — urgent intervention needed to meet Reg 9 economic wellbeing duty`,
        record_id: r.id,
      });
    }
  }

  // High: work ready but not in employment or interview stage
  for (const r of rows) {
    if (
      r.readiness_level === "work_ready" &&
      r.employment_status !== "employed_part_time" &&
      r.employment_status !== "employed_full_time" &&
      r.employment_status !== "interview_stage" &&
      r.employment_status !== "apprenticeship_active" &&
      r.employment_status !== "self_employed" &&
      r.employment_status !== "volunteering"
    ) {
      alerts.push({
        type: "work_ready_not_employed",
        severity: "high",
        message: `${r.child_name} is assessed as work ready but is not in employment or at interview stage — support needed to convert readiness into opportunity`,
        record_id: r.id,
      });
    }
  }

  // High: no CV completed for job-searching young person
  for (const r of rows) {
    if (r.employment_status === "job_searching" && !r.cv_completed) {
      alerts.push({
        type: "job_searching_no_cv",
        severity: "high",
        message: `${r.child_name} is actively job searching but has no CV completed — CV preparation should be prioritised`,
        record_id: r.id,
      });
    }
  }

  // Medium: financial literacy not covered for employed young person
  for (const r of rows) {
    if (
      (r.employment_status === "employed_part_time" ||
        r.employment_status === "employed_full_time" ||
        r.employment_status === "apprenticeship_active" ||
        r.employment_status === "self_employed") &&
      !r.financial_literacy_covered
    ) {
      alerts.push({
        type: "employed_no_financial_literacy",
        severity: "medium",
        message: `${r.child_name} is in employment but financial literacy has not been covered — ensure young person understands pay, tax, and budgeting`,
        record_id: r.id,
      });
    }
  }

  // Medium: workplace rights not covered for employed young person
  for (const r of rows) {
    if (
      (r.employment_status === "employed_part_time" ||
        r.employment_status === "employed_full_time" ||
        r.employment_status === "apprenticeship_active" ||
        r.employment_status === "self_employed") &&
      !r.workplace_rights_covered
    ) {
      alerts.push({
        type: "employed_no_workplace_rights",
        severity: "medium",
        message: `${r.child_name} is in employment but workplace rights have not been covered — ensure young person knows their rights and protections`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateEmploymentSupportCaraInsights(
  rows: YoungPersonEmploymentSupportRow[],
): string[] {
  const metrics = computeEmploymentSupportMetrics(rows);
  const alerts = computeEmploymentSupportAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (lime-themed)
  insights.push(
    `[lime] ${metrics.total_records} employment support records across ${metrics.unique_children} ${metrics.unique_children === 1 ? "young person" : "young people"}. ` +
      `CV completion at ${metrics.cv_completed_rate}%, interview practice at ${metrics.interview_practice_rate}%, ` +
      `and employer engagement at ${metrics.employer_engaged_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.not_in_employment_count} not in employment, ${metrics.not_ready_count} not work ready. ` +
        `Prioritise support for young people furthest from the labour market.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority employment support alerts currently active. ` +
        `${metrics.employed_count} in employment, ${metrics.apprenticeship_count} in apprenticeships. ` +
        `Continue regular employment support reviews to sustain progress.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.not_ready_count > 0) {
    insights.push(
      `[reflect] ${metrics.not_ready_count} ${metrics.not_ready_count === 1 ? "young person is" : "young people are"} assessed as not work ready. ` +
        `What barriers might be preventing readiness, and how can the team tailor individual support plans ` +
        `to build confidence and skills towards employment under Reg 5 duties?`,
    );
  } else if (metrics.child_motivated_rate < 100) {
    insights.push(
      `[reflect] Child motivation is at ${metrics.child_motivated_rate}% across employment support sessions. ` +
        `How can the home better engage young people in their employment journey, ` +
        `and are there creative approaches to make career preparation more appealing and relevant?`,
    );
  } else {
    insights.push(
      `[reflect] All young people are motivated and none are assessed as not work ready. ` +
        `How can the home build on this positive momentum to help young people sustain employment, ` +
        `and what additional workplace skills or qualifications could further strengthen their prospects?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEmploymentSupportMetrics,
  computeEmploymentSupportAlerts,
  generateEmploymentSupportCaraInsights,
};
