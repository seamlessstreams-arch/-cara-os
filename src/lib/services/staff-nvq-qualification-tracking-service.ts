// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF NVQ/QCF QUALIFICATION TRACKING SERVICE
// Tracks NVQ/QCF qualification progress for residential childcare staff —
// enrolment, progress monitoring, assessment status, portfolio completion,
// Reg 32 compliance (Level 3+ within 2 years), and registration status.
//
// CHR 2015 Reg 32 (fitness of premises — qualification requirements),
// Reg 33 (employment — training requirements).
// Level 3 Diploma in Residential Childcare within 2 years of starting.
//
// Covers: qualification enrolment, progress tracking, assessor allocation,
// portfolio monitoring, employer funding, study time, mentor support,
// registration status, and two-year compliance deadline management.
//
// SCCIF: Leadership & Management — "Staff are suitably qualified."
// "The home invests in staff qualifications and professional development."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const QUALIFICATION_LEVELS = ["level_2", "level_3", "level_4", "level_5", "level_6", "level_7"] as const;
export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const QUALIFICATION_STATUSES = ["not_started", "enrolled", "in_progress", "assessment_pending", "completed", "expired", "exemption_granted"] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const QUALIFICATION_TYPES = ["diploma_residential_childcare", "diploma_leadership_management", "certificate_childcare", "nvq_health_social_care", "degree_social_work", "other"] as const;
export type QualificationType = (typeof QUALIFICATION_TYPES)[number];

export const REGISTRATION_STATUSES = ["registered", "pending_registration", "not_registered", "lapsed", "suspended"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffNvqQualificationTrackingRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  review_date: string;
  qualification_level: QualificationLevel;
  qualification_status: QualificationStatus;
  qualification_type: QualificationType;
  registration_status: RegistrationStatus;
  start_date: string;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  reg32_compliant: boolean;
  within_two_year_deadline: boolean;
  assessor_assigned: boolean;
  portfolio_progressing: boolean;
  employer_funded: boolean;
  study_time_allocated: boolean;
  mentor_assigned: boolean;
  registration_current: boolean;
  training_provider: string | null;
  assessor_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export function computeNvqMetrics(rows: StaffNvqQualificationTrackingRow[]): {
  total_records: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  expired_count: number;
  reg32_compliant_rate: number;
  within_deadline_rate: number;
  assessor_assigned_rate: number;
  portfolio_rate: number;
  employer_funded_rate: number;
  study_time_rate: number;
  mentor_rate: number;
  registration_current_rate: number;
  level_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const completedCount = rows.filter((r) => r.qualification_status === "completed").length;
  const inProgressCount = rows.filter((r) => r.qualification_status === "in_progress").length;
  const notStartedCount = rows.filter((r) => r.qualification_status === "not_started").length;
  const expiredCount = rows.filter((r) => r.qualification_status === "expired").length;

  const boolRate = (field: keyof StaffNvqQualificationTrackingRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  };

  const levelBreakdown: Record<string, number> = {};
  for (const r of rows) levelBreakdown[r.qualification_level] = (levelBreakdown[r.qualification_level] ?? 0) + 1;

  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) statusBreakdown[r.qualification_status] = (statusBreakdown[r.qualification_status] ?? 0) + 1;

  return {
    total_records: rows.length,
    completed_count: completedCount,
    in_progress_count: inProgressCount,
    not_started_count: notStartedCount,
    expired_count: expiredCount,
    reg32_compliant_rate: boolRate("reg32_compliant"),
    within_deadline_rate: boolRate("within_two_year_deadline"),
    assessor_assigned_rate: boolRate("assessor_assigned"),
    portfolio_rate: boolRate("portfolio_progressing"),
    employer_funded_rate: boolRate("employer_funded"),
    study_time_rate: boolRate("study_time_allocated"),
    mentor_rate: boolRate("mentor_assigned"),
    registration_current_rate: boolRate("registration_current"),
    level_breakdown: levelBreakdown,
    status_breakdown: statusBreakdown,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeNvqAlerts(
  rows: StaffNvqQualificationTrackingRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical per-record: not reg32 compliant AND not in progress
  for (const r of rows) {
    if (!r.reg32_compliant && r.qualification_status !== "in_progress" && r.qualification_status !== "enrolled") {
      alerts.push({
        type: "reg32_non_compliant_not_progressing",
        severity: "critical",
        message: `${r.staff_name} is not Reg 32 compliant and qualification is not in progress — immediate action required to meet regulatory requirements.`,
        record_id: r.id,
      });
    }
  }

  // High per-record: past expected completion without actual completion
  for (const r of rows) {
    if (
      r.expected_completion_date &&
      !r.actual_completion_date &&
      r.qualification_status !== "completed" &&
      new Date(r.expected_completion_date) < new Date()
    ) {
      alerts.push({
        type: "overdue_completion",
        severity: "high",
        message: `${r.staff_name} has passed expected completion date (${r.expected_completion_date}) without completing qualification.`,
        record_id: r.id,
      });
    }
  }

  // High per-record: not started AND not within two year deadline
  for (const r of rows) {
    if (r.qualification_status === "not_started" && !r.within_two_year_deadline) {
      alerts.push({
        type: "not_started_deadline_risk",
        severity: "high",
        message: `${r.staff_name} has not started qualification and is outside the two-year deadline — regulatory breach risk.`,
        record_id: r.id,
      });
    }
  }

  // Medium per-record: no assessor assigned for in_progress
  for (const r of rows) {
    if (r.qualification_status === "in_progress" && !r.assessor_assigned) {
      alerts.push({
        type: "no_assessor_in_progress",
        severity: "medium",
        message: `${r.staff_name} has qualification in progress but no assessor assigned — may impede completion.`,
        record_id: r.id,
      });
    }
  }

  // Medium per-record: registration not current for completed qualification
  for (const r of rows) {
    if (r.qualification_status === "completed" && !r.registration_current) {
      alerts.push({
        type: "registration_lapsed_completed",
        severity: "medium",
        message: `${r.staff_name} has completed qualification but registration is not current — may affect regulatory standing.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function generateNvqCaraInsights(rows: StaffNvqQualificationTrackingRow[]): string[] {
  const metrics = computeNvqMetrics(rows);
  const alerts = computeNvqAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (sky-themed)
  insights.push(
    `[sky] ${metrics.total_records} NVQ/QCF qualification records across ${metrics.unique_staff} staff ${metrics.unique_staff === 1 ? "member" : "members"}. ` +
      `${metrics.reg32_compliant_rate}% are Reg 32 compliant, ${metrics.completed_count} completed, ` +
      `${metrics.in_progress_count} in progress, and ${metrics.not_started_count} not yet started.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.within_deadline_rate}% within two-year deadline, ${metrics.assessor_assigned_rate}% have assessor assigned, ` +
        `and ${metrics.portfolio_rate}% have portfolios progressing.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.within_deadline_rate}% within two-year deadline and ${metrics.assessor_assigned_rate}% have assessor assigned. ` +
        `Continue monitoring qualification progress to maintain Reg 32 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.not_started_count > 0) {
    insights.push(
      `[reflect] ${metrics.not_started_count} staff ${metrics.not_started_count === 1 ? "member has" : "members have"} not yet started their qualification. ` +
        `What barriers exist to enrolment, and how can the home better support staff to meet the two-year ` +
        `Level 3 requirement under Reg 32?`,
    );
  } else if (metrics.reg32_compliant_rate < 100) {
    insights.push(
      `[reflect] ${metrics.reg32_compliant_rate}% of staff are Reg 32 compliant. ` +
        `Are qualification support structures (funding, study time, mentoring) sufficient to ensure all staff ` +
        `achieve the required Level 3 within the statutory timeframe?`,
    );
  } else {
    insights.push(
      `[reflect] All tracked staff are Reg 32 compliant. ` +
        `How can the home build on this strong foundation to support staff progressing to Level 4/5 ` +
        `qualifications for leadership development?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffNvqQualificationTracking(
  homeId: string,
): Promise<ServiceResult<StaffNvqQualificationTrackingRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_nvq_qualification_tracking") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("review_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffNvqQualificationTrackingRow[] };
}

export async function createStaffNvqQualificationTracking(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  reviewDate: string;
  qualificationLevel: QualificationLevel;
  qualificationStatus: QualificationStatus;
  qualificationType: QualificationType;
  registrationStatus: RegistrationStatus;
  startDate: string;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  reg32Compliant: boolean;
  withinTwoYearDeadline: boolean;
  assessorAssigned: boolean;
  portfolioProgressing: boolean;
  employerFunded: boolean;
  studyTimeAllocated: boolean;
  mentorAssigned: boolean;
  registrationCurrent: boolean;
  trainingProvider?: string | null;
  assessorName?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffNvqQualificationTrackingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_nvq_qualification_tracking") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      review_date: input.reviewDate,
      qualification_level: input.qualificationLevel,
      qualification_status: input.qualificationStatus,
      qualification_type: input.qualificationType,
      registration_status: input.registrationStatus,
      start_date: input.startDate,
      expected_completion_date: input.expectedCompletionDate ?? null,
      actual_completion_date: input.actualCompletionDate ?? null,
      reg32_compliant: input.reg32Compliant,
      within_two_year_deadline: input.withinTwoYearDeadline,
      assessor_assigned: input.assessorAssigned,
      portfolio_progressing: input.portfolioProgressing,
      employer_funded: input.employerFunded,
      study_time_allocated: input.studyTimeAllocated,
      mentor_assigned: input.mentorAssigned,
      registration_current: input.registrationCurrent,
      training_provider: input.trainingProvider ?? null,
      assessor_name: input.assessorName ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffNvqQualificationTrackingRow };
}

export async function updateStaffNvqQualificationTracking(
  id: string,
  updates: Partial<Omit<StaffNvqQualificationTrackingRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffNvqQualificationTrackingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_nvq_qualification_tracking") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffNvqQualificationTrackingRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeNvqMetrics, computeNvqAlerts, generateNvqCaraInsights };
