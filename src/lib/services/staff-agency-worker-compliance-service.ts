// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF AGENCY WORKER COMPLIANCE SERVICE
// Tracks agency worker compliance, induction status, and regulatory checks
// for agency staff working in children's residential homes.
//
// CHR 2015 Reg 32 (fitness of workers — agency staff requirements),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// CHR 2015 Reg 33 (employment of staff — agency arrangements).
//
// Covers: DBS verification, references, qualifications, induction completion,
// safeguarding training, mandatory training, ID verification, right to work,
// supervision arrangements, and shift tracking for agency workers.
//
// SCCIF: Leadership & Management — "Effective management of agency staff
// ensures children receive consistent, safe care."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const COMPLIANCE_STATUSES = ["Compliant", "Partially Compliant", "Non-Compliant", "Pending Review"] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffAgencyWorkerComplianceRow {
  id: string;
  home_id: string;
  staff_name: string;
  agency_name: string;
  start_date: string;
  end_date: string | null;
  compliance_status: ComplianceStatus;
  dbs_verified: boolean;
  references_verified: boolean;
  qualifications_verified: boolean;
  induction_completed: boolean;
  safeguarding_training_confirmed: boolean;
  mandatory_training_confirmed: boolean;
  id_verified: boolean;
  right_to_work_verified: boolean;
  supervision_arranged: boolean;
  shift_count: number;
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

export function computeMetrics(rows: StaffAgencyWorkerComplianceRow[]): {
  total_records: number;
  non_compliant_count: number;
  partially_compliant_count: number;
  pending_count: number;
  dbs_verified_rate: number;
  references_rate: number;
  qualifications_rate: number;
  induction_rate: number;
  safeguarding_rate: number;
  mandatory_training_rate: number;
  supervision_rate: number;
  avg_shifts: number;
  unique_staff: number;
  unique_agencies: number;
} {
  const total = rows.length;

  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;
  const partiallyCompliantCount = rows.filter((r) => r.compliance_status === "Partially Compliant").length;
  const pendingCount = rows.filter((r) => r.compliance_status === "Pending Review").length;

  const boolRate = (field: keyof StaffAgencyWorkerComplianceRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const totalShifts = rows.reduce((sum, r) => sum + r.shift_count, 0);
  const avgShifts = total > 0 ? Math.round((totalShifts / total) * 10) / 10 : 0;

  return {
    total_records: total,
    non_compliant_count: nonCompliantCount,
    partially_compliant_count: partiallyCompliantCount,
    pending_count: pendingCount,
    dbs_verified_rate: boolRate("dbs_verified"),
    references_rate: boolRate("references_verified"),
    qualifications_rate: boolRate("qualifications_verified"),
    induction_rate: boolRate("induction_completed"),
    safeguarding_rate: boolRate("safeguarding_training_confirmed"),
    mandatory_training_rate: boolRate("mandatory_training_confirmed"),
    supervision_rate: boolRate("supervision_arranged"),
    avg_shifts: avgShifts,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_agencies: new Set(rows.map((r) => r.agency_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffAgencyWorkerComplianceRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Non-Compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant_agency_worker",
        severity: "critical",
        message: `${r.staff_name} (${r.agency_name}) is Non-Compliant — agency worker must not continue working until compliance issues are resolved (Reg 32, Sch 2).`,
        record_id: r.id,
      });
    }
  }

  // Critical: DBS not verified (safeguarding risk)
  for (const r of rows) {
    if (!r.dbs_verified) {
      alerts.push({
        type: "dbs_not_verified",
        severity: "critical",
        message: `${r.staff_name} (${r.agency_name}) does not have a verified DBS check — safeguarding risk, agency worker must not have unsupervised access to children.`,
        record_id: r.id,
      });
    }
  }

  // High: induction not completed
  for (const r of rows) {
    if (!r.induction_completed) {
      alerts.push({
        type: "induction_not_completed",
        severity: "high",
        message: `${r.staff_name} (${r.agency_name}) has not completed induction — agency workers must receive a home-specific induction before working with children (Reg 33).`,
        record_id: r.id,
      });
    }
  }

  // High: safeguarding training not confirmed
  for (const r of rows) {
    if (!r.safeguarding_training_confirmed) {
      alerts.push({
        type: "safeguarding_training_not_confirmed",
        severity: "high",
        message: `${r.staff_name} (${r.agency_name}) does not have confirmed safeguarding training — this is a mandatory requirement for all staff working with children.`,
        record_id: r.id,
      });
    }
  }

  // Medium: supervision not arranged
  for (const r of rows) {
    if (!r.supervision_arranged) {
      alerts.push({
        type: "supervision_not_arranged",
        severity: "medium",
        message: `${r.staff_name} (${r.agency_name}) does not have supervision arrangements in place — agency workers require appropriate oversight and support.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── ARIA Insights ─────────────────────────────────────────────────────────

export function computeAriaInsights(rows: StaffAgencyWorkerComplianceRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[purple] ${metrics.total_records} agency worker compliance ${metrics.total_records === 1 ? "record" : "records"} tracked across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "worker" : "workers"} from ${metrics.unique_agencies} ${metrics.unique_agencies === 1 ? "agency" : "agencies"}. ` +
      `${metrics.non_compliant_count} non-compliant, ${metrics.partially_compliant_count} partially compliant, ` +
      `and ${metrics.pending_count} pending review.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.dbs_verified_rate}% DBS verified, ${metrics.induction_rate}% induction completed, ` +
        `and ${metrics.safeguarding_rate}% safeguarding training confirmed.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.dbs_verified_rate}% DBS verified and ${metrics.induction_rate}% induction completed. ` +
        `Continue monitoring agency worker compliance to maintain Reg 32 standards.`,
    );
  }

  // Insight 3: Reflective question about agency worker oversight
  if (metrics.non_compliant_count > 0) {
    insights.push(
      `[reflect] ${metrics.non_compliant_count} agency ${metrics.non_compliant_count === 1 ? "worker is" : "workers are"} non-compliant. ` +
        `What steps are being taken to address compliance gaps, and how does the home ensure ` +
        `agency workers meet the same standards as permanent staff under Reg 32?`,
    );
  } else if (metrics.supervision_rate < 100) {
    insights.push(
      `[reflect] ${metrics.supervision_rate}% of agency workers have supervision arrangements in place. ` +
        `How can the home strengthen oversight of agency staff to ensure children receive ` +
        `consistent, high-quality care regardless of staffing arrangements?`,
    );
  } else {
    insights.push(
      `[reflect] All agency workers are compliant with supervision arrangements in place. ` +
        `How can the home build on this strong position to further integrate agency staff ` +
        `into the team and improve outcomes for children under CHR 2015?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffAgencyWorkerCompliance(
  homeId: string,
): Promise<ServiceResult<StaffAgencyWorkerComplianceRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_agency_worker_compliance") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("start_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffAgencyWorkerComplianceRow[] };
}

export async function createStaffAgencyWorkerCompliance(input: {
  homeId: string;
  staffName: string;
  agencyName: string;
  startDate: string;
  endDate?: string | null;
  complianceStatus: ComplianceStatus;
  dbsVerified?: boolean;
  referencesVerified?: boolean;
  qualificationsVerified?: boolean;
  inductionCompleted?: boolean;
  safeguardingTrainingConfirmed?: boolean;
  mandatoryTrainingConfirmed?: boolean;
  idVerified?: boolean;
  rightToWorkVerified?: boolean;
  supervisionArranged?: boolean;
  shiftCount?: number;
  notes?: string | null;
}): Promise<ServiceResult<StaffAgencyWorkerComplianceRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_agency_worker_compliance") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      agency_name: input.agencyName,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      compliance_status: input.complianceStatus,
      dbs_verified: input.dbsVerified ?? false,
      references_verified: input.referencesVerified ?? false,
      qualifications_verified: input.qualificationsVerified ?? false,
      induction_completed: input.inductionCompleted ?? false,
      safeguarding_training_confirmed: input.safeguardingTrainingConfirmed ?? false,
      mandatory_training_confirmed: input.mandatoryTrainingConfirmed ?? false,
      id_verified: input.idVerified ?? true,
      right_to_work_verified: input.rightToWorkVerified ?? true,
      supervision_arranged: input.supervisionArranged ?? false,
      shift_count: input.shiftCount ?? 0,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffAgencyWorkerComplianceRow };
}

export async function updateStaffAgencyWorkerCompliance(
  id: string,
  updates: Partial<Omit<StaffAgencyWorkerComplianceRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffAgencyWorkerComplianceRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_agency_worker_compliance") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffAgencyWorkerComplianceRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeAriaInsights };
