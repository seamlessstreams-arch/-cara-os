// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF EXIT INTERVIEW MANAGEMENT SERVICE
// Tracks exit interviews, departure processes, knowledge transfer, and
// offboarding compliance for staff in children's residential homes.
//
// CHR 2015 Reg 33 (employment of staff — proper offboarding procedures),
// CHR 2015 Reg 34 (staff leaving — knowledge transfer and continuity of care).
// Safeguarding Vulnerable Groups Act 2006 — access revocation obligations.
//
// Covers: Departure reasons, knowledge transfer, equipment return, access
// revocation, final pay confirmation, reference agreements, compliance tracking.
//
// SCCIF: Leadership & Management — "Effective offboarding ensures continuity
// of care and safeguarding obligations are maintained during staff transitions."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const DEPARTURE_REASONS = [
  "Resignation",
  "Retirement",
  "Redundancy",
  "End of Contract",
  "Dismissal",
  "Transfer",
  "Career Change",
  "Personal Reasons",
  "Other",
] as const;
export type DepartureReason = (typeof DEPARTURE_REASONS)[number];

export const COMPLIANCE_STATUSES = [
  "Complete",
  "Incomplete",
  "Pending",
  "Overdue",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffExitInterviewRow {
  id: string;
  home_id: string;
  interview_date: string;
  interviewer_name: string;
  staff_name: string;
  departure_reason: DepartureReason;
  departure_date: string;
  notice_period_met: boolean;
  knowledge_transfer_completed: boolean;
  handover_document_provided: boolean;
  equipment_returned: boolean;
  access_revoked: boolean;
  final_pay_confirmed: boolean;
  reference_agreed: boolean;
  satisfaction_rating: number | null;
  would_recommend: boolean | null;
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

export function computeMetrics(rows: StaffExitInterviewRow[]): {
  total_interviews: number;
  complete_count: number;
  incomplete_count: number;
  overdue_count: number;
  knowledge_transfer_rate: number;
  handover_rate: number;
  equipment_return_rate: number;
  access_revoked_rate: number;
  final_pay_rate: number;
  reference_rate: number;
  avg_satisfaction: number;
  would_recommend_rate: number;
  notice_period_met_rate: number;
  unique_staff: number;
  unique_interviewers: number;
} {
  const total = rows.length;

  const completeCount = rows.filter((r) => r.compliance_status === "Complete").length;
  const incompleteCount = rows.filter((r) => r.compliance_status === "Incomplete").length;
  const overdueCount = rows.filter((r) => r.compliance_status === "Overdue").length;

  const boolRate = (field: keyof StaffExitInterviewRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // avg_satisfaction: average of non-null ratings, 1 decimal
  const ratedRows = rows.filter((r) => r.satisfaction_rating !== null);
  const avgSatisfaction =
    ratedRows.length > 0
      ? Math.round((ratedRows.reduce((sum, r) => sum + r.satisfaction_rating!, 0) / ratedRows.length) * 10) / 10
      : 0;

  // would_recommend_rate: non-null only
  const recommendRows = rows.filter((r) => r.would_recommend !== null);
  const wouldRecommendCount = recommendRows.filter((r) => r.would_recommend === true).length;
  const wouldRecommendRate =
    recommendRows.length > 0 ? Math.round((wouldRecommendCount / recommendRows.length) * 1000) / 10 : 0;

  return {
    total_interviews: total,
    complete_count: completeCount,
    incomplete_count: incompleteCount,
    overdue_count: overdueCount,
    knowledge_transfer_rate: boolRate("knowledge_transfer_completed"),
    handover_rate: boolRate("handover_document_provided"),
    equipment_return_rate: boolRate("equipment_returned"),
    access_revoked_rate: boolRate("access_revoked"),
    final_pay_rate: boolRate("final_pay_confirmed"),
    reference_rate: boolRate("reference_agreed"),
    avg_satisfaction: avgSatisfaction,
    would_recommend_rate: wouldRecommendRate,
    notice_period_met_rate: boolRate("notice_period_met"),
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_interviewers: new Set(rows.map((r) => r.interviewer_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffExitInterviewRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Departed staff with access not revoked
  for (const r of rows) {
    if (!r.access_revoked) {
      alerts.push({
        type: "access_not_revoked",
        severity: "critical",
        message: `${r.staff_name} has departed but their access has not been revoked — this is a safeguarding risk and must be addressed immediately to protect children and young people in the home.`,
        record_id: r.id,
      });
    }
  }

  // High: Overdue interviews
  for (const r of rows) {
    if (r.compliance_status === "Overdue") {
      alerts.push({
        type: "overdue_interview",
        severity: "high",
        message: `${r.staff_name} has an overdue exit interview — completing exit interviews promptly ensures proper offboarding and regulatory compliance.`,
        record_id: r.id,
      });
    }
  }

  // High: Equipment not returned after departure
  for (const r of rows) {
    if (!r.equipment_returned) {
      alerts.push({
        type: "equipment_not_returned",
        severity: "high",
        message: `${r.staff_name} has not returned equipment after departure — all home equipment must be recovered to maintain operational readiness and data security.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Knowledge transfer not completed
  for (const r of rows) {
    if (!r.knowledge_transfer_completed) {
      alerts.push({
        type: "knowledge_transfer_incomplete",
        severity: "medium",
        message: `${r.staff_name} has not completed knowledge transfer — continuity of care for children and young people depends on thorough handover of responsibilities and information.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffExitInterviewRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[orange] ${metrics.total_interviews} exit ${metrics.total_interviews === 1 ? "interview" : "interviews"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"} conducted by ${metrics.unique_interviewers} ${metrics.unique_interviewers === 1 ? "interviewer" : "interviewers"}. ` +
      `${metrics.complete_count} complete, ${metrics.incomplete_count} incomplete, and ${metrics.overdue_count} overdue.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Access revoked: ${metrics.access_revoked_rate}%, equipment returned: ${metrics.equipment_return_rate}%, ` +
        `knowledge transfer: ${metrics.knowledge_transfer_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Access revoked: ${metrics.access_revoked_rate}%, equipment returned: ${metrics.equipment_return_rate}%. ` +
        `Continue monitoring exit interview compliance to maintain safeguarding standards.`,
    );
  }

  // Insight 3: Reflective question
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `How is the home ensuring all departed staff have their access revoked promptly ` +
        `and that offboarding procedures are completed to safeguard children and young people?`,
    );
  } else if (metrics.knowledge_transfer_rate < 100) {
    insights.push(
      `[reflect] ${metrics.knowledge_transfer_rate}% of departing staff have completed knowledge transfer. ` +
        `How is the home ensuring continuity of care when staff leave, ` +
        `and are handover processes being documented and reviewed?`,
    );
  } else {
    insights.push(
      `[reflect] All exit interview processes are in good standing. ` +
        `How can the home build on this strong offboarding practice to ensure ` +
        `continued compliance with safeguarding and employment obligations?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffExitInterviews(
  homeId: string,
  filters?: { complianceStatus?: ComplianceStatus; departureReason?: DepartureReason },
): Promise<ServiceResult<StaffExitInterviewRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let query = (client.from("cs_staff_exit_interviews") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.complianceStatus) {
    query = query.eq("compliance_status", filters.complianceStatus);
  }
  if (filters?.departureReason) {
    query = query.eq("departure_reason", filters.departureReason);
  }
  const { data, error } = await query.order("interview_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffExitInterviewRow[] };
}

export async function createStaffExitInterview(input: {
  homeId: string;
  interviewDate: string;
  interviewerName: string;
  staffName: string;
  departureReason: DepartureReason;
  departureDate: string;
  noticePeriodMet?: boolean;
  knowledgeTransferCompleted?: boolean;
  handoverDocumentProvided?: boolean;
  equipmentReturned?: boolean;
  accessRevoked?: boolean;
  finalPayConfirmed?: boolean;
  referenceAgreed?: boolean;
  satisfactionRating?: number | null;
  wouldRecommend?: boolean | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<StaffExitInterviewRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_exit_interviews") as SB)
    .insert({
      home_id: input.homeId,
      interview_date: input.interviewDate,
      interviewer_name: input.interviewerName,
      staff_name: input.staffName,
      departure_reason: input.departureReason,
      departure_date: input.departureDate,
      notice_period_met: input.noticePeriodMet ?? true,
      knowledge_transfer_completed: input.knowledgeTransferCompleted ?? false,
      handover_document_provided: input.handoverDocumentProvided ?? false,
      equipment_returned: input.equipmentReturned ?? false,
      access_revoked: input.accessRevoked ?? false,
      final_pay_confirmed: input.finalPayConfirmed ?? false,
      reference_agreed: input.referenceAgreed ?? false,
      satisfaction_rating: input.satisfactionRating ?? null,
      would_recommend: input.wouldRecommend ?? null,
      compliance_status: input.complianceStatus ?? "Pending",
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffExitInterviewRow };
}

export async function updateStaffExitInterview(
  id: string,
  updates: Partial<Omit<StaffExitInterviewRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffExitInterviewRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_exit_interviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffExitInterviewRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
