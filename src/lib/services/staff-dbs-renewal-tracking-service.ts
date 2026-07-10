// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DBS RENEWAL TRACKING SERVICE
// Manages DBS check renewal cycles, update service registration, barred list
// checks, enhanced DBS tracking, and portability for children's home staff.
//
// CHR 2015 Reg 32 (fitness of premises — DBS requirements),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// Safeguarding Vulnerable Groups Act 2006.
//
// Covers: DBS check management, renewal tracking, update service registration,
// barred list checks, enhanced DBS, portability tracking, identity verification,
// right to work confirmation, overseas checks, and risk assessment completion.
//
// SCCIF: Leadership & Management — "Robust safer recruitment practices."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const DBS_TYPES = ["enhanced", "enhanced_barred", "standard", "basic", "update_service"] as const;
export type DbsType = (typeof DBS_TYPES)[number];

export const DBS_STATUSES = ["current", "renewal_due", "expired", "pending", "not_applied", "portability_accepted"] as const;
export type DbsStatus = (typeof DBS_STATUSES)[number];

export const CHECK_OUTCOMES = ["clear", "information_disclosed", "barred", "pending_outcome", "risk_assessed"] as const;
export type CheckOutcome = (typeof CHECK_OUTCOMES)[number];

export const RENEWAL_PRIORITIES = ["routine", "approaching", "urgent", "overdue", "critical"] as const;
export type RenewalPriority = (typeof RENEWAL_PRIORITIES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffDbsRenewalTrackingRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  check_date: string;
  dbs_type: DbsType;
  dbs_status: DbsStatus;
  check_outcome: CheckOutcome;
  renewal_priority: RenewalPriority;
  dbs_number: string | null;
  issue_date: string;
  renewal_date: string | null;
  enhanced_check_completed: boolean;
  barred_list_checked: boolean;
  update_service_registered: boolean;
  identity_verified: boolean;
  right_to_work_confirmed: boolean;
  risk_assessment_completed: boolean;
  overseas_check_completed: boolean;
  references_verified: boolean;
  reviewer_name: string | null;
  disclosed_information: string | null;
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

export function computeDbsMetrics(rows: StaffDbsRenewalTrackingRow[]): {
  total_checks: number;
  expired_count: number;
  renewal_due_count: number;
  pending_count: number;
  disclosed_count: number;
  enhanced_check_rate: number;
  barred_list_rate: number;
  update_service_rate: number;
  identity_verified_rate: number;
  right_to_work_rate: number;
  risk_assessment_rate: number;
  overseas_check_rate: number;
  references_verified_rate: number;
  dbs_type_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const expiredCount = rows.filter((r) => r.dbs_status === "expired").length;
  const renewalDueCount = rows.filter((r) => r.dbs_status === "renewal_due").length;
  const pendingCount = rows.filter((r) => r.dbs_status === "pending").length;
  const disclosedCount = rows.filter((r) => r.check_outcome === "information_disclosed").length;

  const boolRate = (field: keyof StaffDbsRenewalTrackingRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  };

  const dbsTypeBreakdown: Record<string, number> = {};
  for (const r of rows) dbsTypeBreakdown[r.dbs_type] = (dbsTypeBreakdown[r.dbs_type] ?? 0) + 1;

  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) statusBreakdown[r.dbs_status] = (statusBreakdown[r.dbs_status] ?? 0) + 1;

  return {
    total_checks: rows.length,
    expired_count: expiredCount,
    renewal_due_count: renewalDueCount,
    pending_count: pendingCount,
    disclosed_count: disclosedCount,
    enhanced_check_rate: boolRate("enhanced_check_completed"),
    barred_list_rate: boolRate("barred_list_checked"),
    update_service_rate: boolRate("update_service_registered"),
    identity_verified_rate: boolRate("identity_verified"),
    right_to_work_rate: boolRate("right_to_work_confirmed"),
    risk_assessment_rate: boolRate("risk_assessment_completed"),
    overseas_check_rate: boolRate("overseas_check_completed"),
    references_verified_rate: boolRate("references_verified"),
    dbs_type_breakdown: dbsTypeBreakdown,
    status_breakdown: statusBreakdown,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeDbsAlerts(
  rows: StaffDbsRenewalTrackingRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: expired DBS — staff still working with expired check
  for (const r of rows) {
    if (r.dbs_status === "expired") {
      alerts.push({
        type: "expired_dbs_still_working",
        severity: "critical",
        message: `${r.staff_name} has an expired DBS check — staff must not work unsupervised with children until renewed (Reg 32, Sch 2).`,
        record_id: r.id,
      });
    }
  }

  // Critical: barred list not checked
  for (const r of rows) {
    if (!r.barred_list_checked && (r.dbs_type === "enhanced" || r.dbs_type === "enhanced_barred")) {
      alerts.push({
        type: "barred_list_not_checked",
        severity: "critical",
        message: `${r.staff_name} has not had a barred list check completed — required under Safeguarding Vulnerable Groups Act 2006.`,
        record_id: r.id,
      });
    }
  }

  // High: renewal overdue priority
  for (const r of rows) {
    if (r.renewal_priority === "overdue" || r.renewal_priority === "critical") {
      alerts.push({
        type: "renewal_overdue_priority",
        severity: "high",
        message: `${r.staff_name} has ${r.renewal_priority} renewal priority — DBS renewal requires immediate attention.`,
        record_id: r.id,
      });
    }
  }

  // High: enhanced check not completed for children's home role
  for (const r of rows) {
    if (!r.enhanced_check_completed && (r.dbs_type === "enhanced" || r.dbs_type === "enhanced_barred")) {
      alerts.push({
        type: "enhanced_not_completed",
        severity: "high",
        message: `${r.staff_name} has not completed enhanced DBS check — required for all children's home roles under CHR 2015 Reg 32.`,
        record_id: r.id,
      });
    }
  }

  // Medium: update service not registered
  for (const r of rows) {
    if (!r.update_service_registered && r.dbs_status !== "not_applied" && r.dbs_status !== "pending") {
      alerts.push({
        type: "update_service_not_registered",
        severity: "medium",
        message: `${r.staff_name} is not registered with the DBS Update Service — registration enables continuous monitoring and portability.`,
        record_id: r.id,
      });
    }
  }

  // Medium: overseas check not completed
  for (const r of rows) {
    if (!r.overseas_check_completed) {
      alerts.push({
        type: "overseas_check_not_completed",
        severity: "medium",
        message: `${r.staff_name} has not completed overseas criminal record check — required under Sch 2 for staff who have lived abroad.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function generateDbsCaraInsights(rows: StaffDbsRenewalTrackingRow[]): string[] {
  const metrics = computeDbsMetrics(rows);
  const alerts = computeDbsAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (purple-themed)
  insights.push(
    `[purple] ${metrics.total_checks} DBS ${metrics.total_checks === 1 ? "check" : "checks"} tracked across ${metrics.unique_staff} staff ${metrics.unique_staff === 1 ? "member" : "members"}. ` +
      `${metrics.expired_count} expired, ${metrics.renewal_due_count} renewal due, ` +
      `${metrics.pending_count} pending, and ${metrics.disclosed_count} with disclosed information.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.barred_list_rate}% barred list checked, ${metrics.enhanced_check_rate}% enhanced checks completed, ` +
        `and ${metrics.update_service_rate}% registered with the Update Service.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.barred_list_rate}% barred list checked and ${metrics.enhanced_check_rate}% enhanced checks completed. ` +
        `Continue monitoring DBS renewal cycles to maintain Reg 32 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.expired_count > 0) {
    insights.push(
      `[reflect] ${metrics.expired_count} DBS ${metrics.expired_count === 1 ? "check has" : "checks have"} expired. ` +
        `What processes are in place to ensure timely renewal, and are staff with expired checks ` +
        `being appropriately supervised pending renewal under Reg 32?`,
    );
  } else if (metrics.update_service_rate < 100) {
    insights.push(
      `[reflect] ${metrics.update_service_rate}% of staff are registered with the DBS Update Service. ` +
        `Would increasing Update Service registration improve portability and reduce ` +
        `administrative burden during the renewal cycle?`,
    );
  } else {
    insights.push(
      `[reflect] All DBS checks are current and staff are registered with the Update Service. ` +
        `How can the home leverage this strong compliance position to support safer recruitment ` +
        `best practice and continuous monitoring under CHR 2015?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffDbsRenewalTracking(
  homeId: string,
): Promise<ServiceResult<StaffDbsRenewalTrackingRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_dbs_renewal_tracking") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("check_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffDbsRenewalTrackingRow[] };
}

export async function createStaffDbsRenewalTracking(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  checkDate: string;
  dbsType: DbsType;
  dbsStatus: DbsStatus;
  checkOutcome: CheckOutcome;
  renewalPriority: RenewalPriority;
  dbsNumber?: string | null;
  issueDate: string;
  renewalDate?: string | null;
  enhancedCheckCompleted: boolean;
  barredListChecked: boolean;
  updateServiceRegistered: boolean;
  identityVerified: boolean;
  rightToWorkConfirmed: boolean;
  riskAssessmentCompleted: boolean;
  overseasCheckCompleted: boolean;
  referencesVerified: boolean;
  reviewerName?: string | null;
  disclosedInformation?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffDbsRenewalTrackingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_dbs_renewal_tracking") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      check_date: input.checkDate,
      dbs_type: input.dbsType,
      dbs_status: input.dbsStatus,
      check_outcome: input.checkOutcome,
      renewal_priority: input.renewalPriority,
      dbs_number: input.dbsNumber ?? null,
      issue_date: input.issueDate,
      renewal_date: input.renewalDate ?? null,
      enhanced_check_completed: input.enhancedCheckCompleted,
      barred_list_checked: input.barredListChecked,
      update_service_registered: input.updateServiceRegistered,
      identity_verified: input.identityVerified,
      right_to_work_confirmed: input.rightToWorkConfirmed,
      risk_assessment_completed: input.riskAssessmentCompleted,
      overseas_check_completed: input.overseasCheckCompleted,
      references_verified: input.referencesVerified,
      reviewer_name: input.reviewerName ?? null,
      disclosed_information: input.disclosedInformation ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffDbsRenewalTrackingRow };
}

export async function updateStaffDbsRenewalTracking(
  id: string,
  updates: Partial<Omit<StaffDbsRenewalTrackingRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffDbsRenewalTrackingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_dbs_renewal_tracking") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffDbsRenewalTrackingRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeDbsMetrics, computeDbsAlerts, generateDbsCaraInsights };
