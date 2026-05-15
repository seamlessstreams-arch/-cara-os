// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SECONDMENT MANAGEMENT SERVICE
// Tracks staff secondment arrangements, terms, and compliance for children's
// residential homes.
//
// CHR 2015 Reg 32 (fitness of workers — secondment arrangements),
// CHR 2015 Reg 33 (employment of staff — temporary staffing arrangements).
//
// Covers: secondment agreements, DBS transfers, induction completion,
// supervision arrangements, objectives, review scheduling, and extensions
// for staff on incoming, outgoing, internal, or cross-organisation secondments.
//
// SCCIF: Leadership & Management — "Effective management of secondment
// arrangements ensures children receive consistent, safe care from
// appropriately vetted and supervised staff."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const SECONDMENT_TYPES = ["Incoming", "Outgoing", "Internal Transfer", "Cross-Organisation"] as const;
export type SecondmentType = (typeof SECONDMENT_TYPES)[number];

export const SECONDMENT_STATUSES = ["Active", "Completed", "Extended", "Terminated Early", "Pending"] as const;
export type SecondmentStatus = (typeof SECONDMENT_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffSecondmentManagementRow {
  id: string;
  home_id: string;
  staff_name: string;
  secondment_type: SecondmentType;
  sending_organisation: string;
  receiving_organisation: string;
  start_date: string;
  end_date: string | null;
  status: SecondmentStatus;
  agreement_signed: boolean;
  dbs_transferred: boolean;
  induction_completed: boolean;
  supervision_arranged: boolean;
  objectives_agreed: boolean;
  review_date: string | null;
  extension_requested: boolean;
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

export function computeMetrics(rows: StaffSecondmentManagementRow[]): {
  total_secondments: number;
  active_count: number;
  completed_count: number;
  pending_count: number;
  agreement_rate: number;
  dbs_transfer_rate: number;
  induction_rate: number;
  supervision_rate: number;
  objectives_rate: number;
  review_scheduled_rate: number;
  extension_count: number;
  unique_staff: number;
} {
  const total = rows.length;

  const activeCount = rows.filter((r) => r.status === "Active").length;
  const completedCount = rows.filter((r) => r.status === "Completed").length;
  const pendingCount = rows.filter((r) => r.status === "Pending").length;

  const boolRate = (field: keyof StaffSecondmentManagementRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const reviewScheduledCount = rows.filter((r) => r.review_date !== null).length;
  const reviewScheduledRate = total > 0 ? Math.round((reviewScheduledCount / total) * 1000) / 10 : 0;

  const extensionCount = rows.filter((r) => r.extension_requested === true).length;

  return {
    total_secondments: total,
    active_count: activeCount,
    completed_count: completedCount,
    pending_count: pendingCount,
    agreement_rate: boolRate("agreement_signed"),
    dbs_transfer_rate: boolRate("dbs_transferred"),
    induction_rate: boolRate("induction_completed"),
    supervision_rate: boolRate("supervision_arranged"),
    objectives_rate: boolRate("objectives_agreed"),
    review_scheduled_rate: reviewScheduledRate,
    extension_count: extensionCount,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffSecondmentManagementRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  const active = rows.filter((r) => r.status === "Active");

  // Critical: Active secondment without agreement signed
  for (const r of active) {
    if (!r.agreement_signed) {
      alerts.push({
        type: "active_without_agreement",
        severity: "critical",
        message: `${r.staff_name} has an active ${r.secondment_type.toLowerCase()} secondment without a signed agreement — secondment agreement must be formalised before the worker continues (Reg 32).`,
        record_id: r.id,
      });
    }
  }

  // Critical: Active secondment without DBS transferred
  for (const r of active) {
    if (!r.dbs_transferred) {
      alerts.push({
        type: "active_without_dbs",
        severity: "critical",
        message: `${r.staff_name} has an active secondment without DBS transfer — safeguarding risk, DBS status must be confirmed before unsupervised access to children.`,
        record_id: r.id,
      });
    }
  }

  // High: Active secondment without induction completed
  for (const r of active) {
    if (!r.induction_completed) {
      alerts.push({
        type: "active_without_induction",
        severity: "high",
        message: `${r.staff_name} has an active secondment without completing induction — seconded staff must receive a home-specific induction before working with children (Reg 33).`,
        record_id: r.id,
      });
    }
  }

  // Medium: Active secondment without supervision arranged
  for (const r of active) {
    if (!r.supervision_arranged) {
      alerts.push({
        type: "active_without_supervision",
        severity: "medium",
        message: `${r.staff_name} has an active secondment without supervision arrangements in place — seconded staff require appropriate oversight and support.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── ARIA Insights ─────────────────────────────────────────────────────────

export function computeAriaInsights(rows: StaffSecondmentManagementRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[purple] ${metrics.total_secondments} secondment ${metrics.total_secondments === 1 ? "arrangement" : "arrangements"} tracked across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `${metrics.active_count} active, ${metrics.completed_count} completed, ` +
      `and ${metrics.pending_count} pending.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.agreement_rate}% agreements signed, ${metrics.dbs_transfer_rate}% DBS transferred, ` +
        `and ${metrics.induction_rate}% inductions completed.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.agreement_rate}% agreements signed and ${metrics.induction_rate}% inductions completed. ` +
        `Continue monitoring secondment compliance to maintain Reg 32 standards.`,
    );
  }

  // Insight 3: Reflective question about secondment oversight
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `What steps are being taken to ensure all secondment arrangements are properly formalised ` +
        `and that seconded staff meet the same safeguarding standards as permanent staff under Reg 32?`,
    );
  } else if (metrics.supervision_rate < 100) {
    insights.push(
      `[reflect] ${metrics.supervision_rate}% of seconded staff have supervision arrangements in place. ` +
        `How can the home strengthen oversight of seconded staff to ensure children receive ` +
        `consistent, high-quality care regardless of staffing arrangements?`,
    );
  } else {
    insights.push(
      `[reflect] All secondment arrangements are compliant with supervision in place. ` +
        `How can the home build on this strong position to further integrate seconded staff ` +
        `into the team and improve outcomes for children under CHR 2015?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffSecondmentManagement(
  homeId: string,
): Promise<ServiceResult<StaffSecondmentManagementRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_secondment_management") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("start_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSecondmentManagementRow[] };
}

export async function createStaffSecondmentManagement(input: {
  homeId: string;
  staffName: string;
  secondmentType: SecondmentType;
  sendingOrganisation: string;
  receivingOrganisation: string;
  startDate: string;
  endDate?: string | null;
  status: SecondmentStatus;
  agreementSigned?: boolean;
  dbsTransferred?: boolean;
  inductionCompleted?: boolean;
  supervisionArranged?: boolean;
  objectivesAgreed?: boolean;
  reviewDate?: string | null;
  extensionRequested?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<StaffSecondmentManagementRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_secondment_management") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      secondment_type: input.secondmentType,
      sending_organisation: input.sendingOrganisation,
      receiving_organisation: input.receivingOrganisation,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      status: input.status,
      agreement_signed: input.agreementSigned ?? false,
      dbs_transferred: input.dbsTransferred ?? false,
      induction_completed: input.inductionCompleted ?? false,
      supervision_arranged: input.supervisionArranged ?? false,
      objectives_agreed: input.objectivesAgreed ?? false,
      review_date: input.reviewDate ?? null,
      extension_requested: input.extensionRequested ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSecondmentManagementRow };
}

export async function updateStaffSecondmentManagement(
  id: string,
  updates: Partial<Omit<StaffSecondmentManagementRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffSecondmentManagementRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_secondment_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSecondmentManagementRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeAriaInsights };
