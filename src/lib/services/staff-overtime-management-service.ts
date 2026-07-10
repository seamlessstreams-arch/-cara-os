// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF OVERTIME MANAGEMENT SERVICE
// Tracks staff overtime hours, Working Time Regulations compliance,
// rest break adherence, night worker protections, and authorisation status
// for staff in children's residential homes.
//
// Working Time Regulations 1998 — 48-hour weekly limit, rest breaks,
// night worker protections, opt-out provisions.
// CHR 2015 Reg 32 (fitness of workers — staff welfare and safe working hours).
//
// Covers: Contracted vs actual hours, overtime authorisation, TOIL accrual,
// 48-hour limit compliance, opt-out tracking, rest break compliance,
// night worker hours monitoring.
//
// SCCIF: Leadership & Management — "Staff work patterns and overtime are
// managed effectively to ensure safe staffing levels and regulatory compliance."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Opt-Out Valid",
  "Review Required",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffOvertimeManagementRow {
  id: string;
  home_id: string;
  review_date: string;
  reviewer_name: string;
  staff_name: string;
  review_period_start: string;
  review_period_end: string;
  contracted_hours: number;
  actual_hours: number;
  overtime_hours: number;
  weekly_average_hours: number;
  exceeds_48_hours: boolean;
  opt_out_signed: boolean;
  opt_out_date: string | null;
  rest_break_compliant: boolean;
  night_worker: boolean;
  night_hours_compliant: boolean | null;
  overtime_authorised: boolean;
  overtime_paid: boolean;
  toil_accrued: boolean;
  compliance_status: ComplianceStatus;
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

export function computeMetrics(rows: StaffOvertimeManagementRow[]): {
  total_reviews: number;
  exceeds_48_count: number;
  non_compliant_count: number;
  opt_out_count: number;
  opt_out_rate: number;
  rest_break_compliant_rate: number;
  overtime_authorised_rate: number;
  overtime_paid_rate: number;
  toil_accrued_count: number;
  night_worker_count: number;
  avg_weekly_hours: number;
  avg_overtime_hours: number;
  avg_contracted_hours: number;
  unique_staff: number;
  unique_reviewers: number;
} {
  const total = rows.length;

  const exceeds48Count = rows.filter((r) => r.exceeds_48_hours).length;
  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;
  const optOutCount = rows.filter((r) => r.opt_out_signed).length;
  const toilAccruedCount = rows.filter((r) => r.toil_accrued).length;
  const nightWorkerCount = rows.filter((r) => r.night_worker).length;

  const boolRate = (field: keyof StaffOvertimeManagementRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const avg = (field: keyof StaffOvertimeManagementRow) => {
    if (total === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + (r[field] as number), 0);
    return Math.round((sum / total) * 10) / 10;
  };

  return {
    total_reviews: total,
    exceeds_48_count: exceeds48Count,
    non_compliant_count: nonCompliantCount,
    opt_out_count: optOutCount,
    opt_out_rate: boolRate("opt_out_signed"),
    rest_break_compliant_rate: boolRate("rest_break_compliant"),
    overtime_authorised_rate: boolRate("overtime_authorised"),
    overtime_paid_rate: boolRate("overtime_paid"),
    toil_accrued_count: toilAccruedCount,
    night_worker_count: nightWorkerCount,
    avg_weekly_hours: avg("weekly_average_hours"),
    avg_overtime_hours: avg("overtime_hours"),
    avg_contracted_hours: avg("contracted_hours"),
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_reviewers: new Set(rows.map((r) => r.reviewer_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffOvertimeManagementRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Exceeds 48 hours without opt-out
  for (const r of rows) {
    if (r.exceeds_48_hours && !r.opt_out_signed) {
      alerts.push({
        type: "exceeds_48_no_opt_out",
        severity: "critical",
        message: `${r.staff_name} is exceeding the 48-hour weekly limit without a signed opt-out agreement — the home must act immediately to reduce hours or obtain a valid opt-out under the Working Time Regulations 1998.`,
        record_id: r.id,
      });
    }
  }

  // High: Rest break non-compliant
  for (const r of rows) {
    if (!r.rest_break_compliant) {
      alerts.push({
        type: "rest_break_non_compliant",
        severity: "high",
        message: `${r.staff_name} is not receiving compliant rest breaks — the home must ensure all staff receive adequate rest periods in line with the Working Time Regulations 1998 to protect their health and safety.`,
        record_id: r.id,
      });
    }
  }

  // High: Night worker with non-compliant hours
  for (const r of rows) {
    if (r.night_worker && r.night_hours_compliant === false) {
      alerts.push({
        type: "night_hours_non_compliant",
        severity: "high",
        message: `${r.staff_name} is a night worker whose hours are non-compliant — night workers must not exceed an average of 8 hours in any 24-hour period under the Working Time Regulations 1998.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overtime not authorised
  for (const r of rows) {
    if (!r.overtime_authorised) {
      alerts.push({
        type: "overtime_not_authorised",
        severity: "medium",
        message: `${r.staff_name} has overtime hours that have not been authorised — all overtime must be properly approved to ensure safe staffing levels and accurate payroll records.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Exceeds 48 hours with opt-out but review required
  for (const r of rows) {
    if (r.exceeds_48_hours && r.opt_out_signed && r.compliance_status === "Review Required") {
      alerts.push({
        type: "exceeds_48_review_required",
        severity: "medium",
        message: `${r.staff_name} is exceeding the 48-hour weekly limit with an opt-out but the review status requires attention — the home should verify that the opt-out remains valid and that the staff member's wellbeing is not being compromised.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffOvertimeManagementRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[amber] ${metrics.total_reviews} overtime ${metrics.total_reviews === 1 ? "review" : "reviews"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"} reviewed by ${metrics.unique_reviewers} ${metrics.unique_reviewers === 1 ? "reviewer" : "reviewers"}. ` +
      `Average weekly hours: ${metrics.avg_weekly_hours}, average overtime: ${metrics.avg_overtime_hours}, average contracted: ${metrics.avg_contracted_hours}.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[orange] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Exceeds 48 hours: ${metrics.exceeds_48_count}, rest break compliant: ${metrics.rest_break_compliant_rate}%, ` +
        `overtime authorised: ${metrics.overtime_authorised_rate}%.`,
    );
  } else {
    insights.push(
      `[orange] No critical or high-priority alerts currently active. ` +
        `Rest break compliant: ${metrics.rest_break_compliant_rate}%, overtime authorised: ${metrics.overtime_authorised_rate}%. ` +
        `Continue monitoring working time compliance to maintain staff welfare standards.`,
    );
  }

  // Insight 3: Reflective question
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `How is the home ensuring staff working hours remain within safe limits ` +
        `and that all opt-out agreements are valid and voluntary under the Working Time Regulations 1998?`,
    );
  } else if (metrics.overtime_authorised_rate < 100) {
    insights.push(
      `[reflect] ${metrics.overtime_authorised_rate}% of overtime has been authorised. ` +
        `How is the home ensuring all overtime is properly approved, ` +
        `and are processes in place to monitor staff wellbeing and prevent excessive working hours?`,
    );
  } else {
    insights.push(
      `[reflect] All overtime management processes are in good standing. ` +
        `How can the home build on this strong compliance practice to ensure ` +
        `continued adherence to the Working Time Regulations and staff welfare obligations?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffOvertimeManagement(
  homeId: string,
  filters?: { complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<StaffOvertimeManagementRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let query = (client.from("cs_staff_overtime_management") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.complianceStatus) {
    query = query.eq("compliance_status", filters.complianceStatus);
  }
  const { data, error } = await query.order("review_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffOvertimeManagementRow[] };
}

export async function createStaffOvertimeManagement(input: {
  homeId: string;
  reviewDate: string;
  reviewerName: string;
  staffName: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  contractedHours: number;
  actualHours: number;
  overtimeHours?: number;
  weeklyAverageHours: number;
  exceeds48Hours?: boolean;
  optOutSigned?: boolean;
  optOutDate?: string | null;
  restBreakCompliant?: boolean;
  nightWorker?: boolean;
  nightHoursCompliant?: boolean | null;
  overtimeAuthorised?: boolean;
  overtimePaid?: boolean;
  toilAccrued?: boolean;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<StaffOvertimeManagementRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_overtime_management") as SB)
    .insert({
      home_id: input.homeId,
      review_date: input.reviewDate,
      reviewer_name: input.reviewerName,
      staff_name: input.staffName,
      review_period_start: input.reviewPeriodStart,
      review_period_end: input.reviewPeriodEnd,
      contracted_hours: input.contractedHours,
      actual_hours: input.actualHours,
      overtime_hours: input.overtimeHours ?? 0,
      weekly_average_hours: input.weeklyAverageHours,
      exceeds_48_hours: input.exceeds48Hours ?? false,
      opt_out_signed: input.optOutSigned ?? false,
      opt_out_date: input.optOutDate ?? null,
      rest_break_compliant: input.restBreakCompliant ?? true,
      night_worker: input.nightWorker ?? false,
      night_hours_compliant: input.nightHoursCompliant ?? null,
      overtime_authorised: input.overtimeAuthorised ?? true,
      overtime_paid: input.overtimePaid ?? false,
      toil_accrued: input.toilAccrued ?? false,
      compliance_status: input.complianceStatus ?? "Compliant",
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffOvertimeManagementRow };
}

export async function updateStaffOvertimeManagement(
  id: string,
  updates: Partial<Omit<StaffOvertimeManagementRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffOvertimeManagementRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_overtime_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffOvertimeManagementRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
