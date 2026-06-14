// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PAYROLL COMPLIANCE SERVICE
// Tracks payroll compliance checks, right to work verification, pension
// auto-enrolment, and HMRC compliance for staff in children's residential homes.
//
// CHR 2015 Reg 32 (fitness of workers — employment verification),
// CHR 2015 Reg 33 (employment of staff — payroll & contract requirements).
// The Pensions Act 2008 — automatic enrolment duties.
// Immigration, Asylum and Nationality Act 2006 — right to work obligations.
//
// Covers: Right to Work, Tax Code, Pension Enrolment, NI Verification,
// Holiday Entitlement, Pay Rate Review, HMRC Compliance checks.
//
// SCCIF: Leadership & Management — "Robust payroll compliance ensures
// staff are lawfully employed and fairly remunerated."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const CHECK_TYPES = [
  "Right to Work",
  "Tax Code",
  "Pension Enrolment",
  "NI Verification",
  "Holiday Entitlement",
  "Pay Rate Review",
  "HMRC Compliance",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Pending Verification",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffPayrollComplianceRow {
  id: string;
  home_id: string;
  staff_name: string;
  check_date: string;
  check_type: CheckType;
  compliance_status: ComplianceStatus;
  right_to_work_verified: boolean;
  pension_enrolled: boolean;
  pension_opt_out: boolean;
  tax_code_verified: boolean;
  ni_number_verified: boolean;
  contract_on_file: boolean;
  pay_rate_confirmed: boolean;
  next_review_date: string | null;
  reviewer_name: string;
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

export function computeMetrics(rows: StaffPayrollComplianceRow[]): {
  total_checks: number;
  non_compliant_count: number;
  action_required_count: number;
  right_to_work_rate: number;
  pension_enrolled_rate: number;
  tax_code_rate: number;
  ni_verified_rate: number;
  contract_rate: number;
  pay_rate_confirmed_rate: number;
  review_scheduled_rate: number;
  unique_staff: number;
  unique_reviewers: number;
} {
  const total = rows.length;

  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;
  const actionRequiredCount = rows.filter((r) => r.compliance_status === "Action Required").length;

  const boolRate = (field: keyof StaffPayrollComplianceRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const reviewScheduledCount = rows.filter((r) => r.next_review_date !== null).length;
  const reviewScheduledRate = total > 0 ? Math.round((reviewScheduledCount / total) * 1000) / 10 : 0;

  return {
    total_checks: total,
    non_compliant_count: nonCompliantCount,
    action_required_count: actionRequiredCount,
    right_to_work_rate: boolRate("right_to_work_verified"),
    pension_enrolled_rate: boolRate("pension_enrolled"),
    tax_code_rate: boolRate("tax_code_verified"),
    ni_verified_rate: boolRate("ni_number_verified"),
    contract_rate: boolRate("contract_on_file"),
    pay_rate_confirmed_rate: boolRate("pay_rate_confirmed"),
    review_scheduled_rate: reviewScheduledRate,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_reviewers: new Set(rows.map((r) => r.reviewer_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffPayrollComplianceRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Right to work not verified (illegal to employ)
  for (const r of rows) {
    if (!r.right_to_work_verified) {
      alerts.push({
        type: "right_to_work_not_verified",
        severity: "critical",
        message: `${r.staff_name} does not have verified right to work — it is illegal to employ a person without confirming their right to work in the UK (Immigration, Asylum and Nationality Act 2006).`,
        record_id: r.id,
      });
    }
  }

  // High: Non-Compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant_check",
        severity: "high",
        message: `${r.staff_name} has a Non-Compliant ${r.check_type} check — immediate action required to meet HMRC and employment law obligations.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Pension not enrolled and not opted out (auto-enrolment duty)
  for (const r of rows) {
    if (!r.pension_enrolled && !r.pension_opt_out) {
      alerts.push({
        type: "pension_auto_enrolment_due",
        severity: "medium",
        message: `${r.staff_name} is not enrolled in a pension and has not opted out — employer has a legal duty to auto-enrol eligible staff under the Pensions Act 2008.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Contract not on file
  for (const r of rows) {
    if (!r.contract_on_file) {
      alerts.push({
        type: "contract_not_on_file",
        severity: "medium",
        message: `${r.staff_name} does not have a contract on file — employers must provide a written statement of employment particulars within two months of start date.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffPayrollComplianceRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[purple] ${metrics.total_checks} payroll compliance ${metrics.total_checks === 1 ? "check" : "checks"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"} reviewed by ${metrics.unique_reviewers} ${metrics.unique_reviewers === 1 ? "reviewer" : "reviewers"}. ` +
      `${metrics.non_compliant_count} non-compliant and ${metrics.action_required_count} action required.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Right to work verified: ${metrics.right_to_work_rate}%, tax code verified: ${metrics.tax_code_rate}%, ` +
        `pension enrolled: ${metrics.pension_enrolled_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Right to work verified: ${metrics.right_to_work_rate}%, tax code verified: ${metrics.tax_code_rate}%. ` +
        `Continue monitoring payroll compliance to maintain HMRC standards.`,
    );
  }

  // Insight 3: Reflective question
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical payroll ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `How is the home ensuring all staff have verified right to work documentation ` +
        `and that HMRC obligations are being met in a timely manner?`,
    );
  } else if (metrics.pension_enrolled_rate < 100) {
    insights.push(
      `[reflect] ${metrics.pension_enrolled_rate}% of staff are enrolled in a workplace pension. ` +
        `How is the home meeting its auto-enrolment duties under the Pensions Act 2008, ` +
        `and are opt-out decisions being properly recorded and reviewed?`,
    );
  } else {
    insights.push(
      `[reflect] All payroll compliance checks are in good standing. ` +
        `How can the home build on this strong compliance position to ensure ` +
        `continued adherence to HMRC requirements and employment law obligations?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffPayrollCompliance(
  homeId: string,
): Promise<ServiceResult<StaffPayrollComplianceRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_payroll_compliance") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("check_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPayrollComplianceRow[] };
}

export async function createStaffPayrollCompliance(input: {
  homeId: string;
  staffName: string;
  checkDate: string;
  checkType: CheckType;
  complianceStatus: ComplianceStatus;
  rightToWorkVerified?: boolean;
  pensionEnrolled?: boolean;
  pensionOptOut?: boolean;
  taxCodeVerified?: boolean;
  niNumberVerified?: boolean;
  contractOnFile?: boolean;
  payRateConfirmed?: boolean;
  nextReviewDate?: string | null;
  reviewerName: string;
  notes?: string | null;
}): Promise<ServiceResult<StaffPayrollComplianceRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_payroll_compliance") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      check_date: input.checkDate,
      check_type: input.checkType,
      compliance_status: input.complianceStatus,
      right_to_work_verified: input.rightToWorkVerified ?? true,
      pension_enrolled: input.pensionEnrolled ?? false,
      pension_opt_out: input.pensionOptOut ?? false,
      tax_code_verified: input.taxCodeVerified ?? true,
      ni_number_verified: input.niNumberVerified ?? true,
      contract_on_file: input.contractOnFile ?? true,
      pay_rate_confirmed: input.payRateConfirmed ?? true,
      next_review_date: input.nextReviewDate ?? null,
      reviewer_name: input.reviewerName,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPayrollComplianceRow };
}

export async function updateStaffPayrollCompliance(
  id: string,
  updates: Partial<Omit<StaffPayrollComplianceRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffPayrollComplianceRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_payroll_compliance") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPayrollComplianceRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
