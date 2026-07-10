// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ANNUAL LEAVE SERVICE
// Manages Staff Annual Leave tracking — leave requests, approval workflow,
// entitlement monitoring, cover arrangements, and impact on staffing levels.
// CHR 2015 Reg 33 (employment of staff — sufficient and suitable),
// Reg 34 (employment of staff — fitness to work).
//
// Tracks annual leave, bank holidays, compassionate leave, parental leave,
// TOIL, and other leave types. Monitors cover arrangements to ensure
// minimum staffing levels are maintained during leave periods.
//
// SCCIF: Well-Led — "The home has enough suitably qualified,
// competent and experienced staff." "Staff leave is managed to ensure
// continuity of care for children."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const LEAVE_TYPES = [
  "annual_leave",
  "bank_holiday",
  "compassionate",
  "parental",
  "maternity",
  "paternity",
  "sick_leave",
  "unpaid_leave",
  "training_day",
  "toil",
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const APPROVAL_STATUSES = [
  "requested",
  "approved",
  "declined",
  "cancelled",
  "pending_cover",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const COVER_ARRANGEMENTS = [
  "agency_cover",
  "bank_staff",
  "internal_swap",
  "manager_cover",
  "no_cover_needed",
] as const;
export type CoverArrangement = (typeof COVER_ARRANGEMENTS)[number];

export const STAFFING_IMPACTS = [
  "no_impact",
  "minor_impact",
  "moderate_impact",
  "significant_impact",
  "critical_understaffing",
] as const;
export type StaffingImpact = (typeof STAFFING_IMPACTS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface StaffAnnualLeaveRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  start_date: string;
  end_date: string;
  leave_type: string;
  approval_status: string;
  cover_arrangement: string;
  staffing_impact: string;
  days_requested: number;
  approved_by: string | null;
  cover_confirmed: boolean;
  handover_completed: boolean;
  children_informed: boolean;
  minimum_staffing_maintained: boolean;
  entitlement_remaining: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffAnnualLeaveMetrics(
  rows: StaffAnnualLeaveRow[],
): {
  total_requests: number;
  declined_count: number;
  pending_count: number;
  critical_understaffing_count: number;
  no_cover_count: number;
  cover_confirmed_rate: number;
  handover_completed_rate: number;
  children_informed_rate: number;
  minimum_staffing_rate: number;
  approved_rate: number;
  leave_type_breakdown: Record<string, number>;
  impact_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const declinedCount = rows.filter((r) => r.approval_status === "declined").length;
  const pendingCount = rows.filter(
    (r) => r.approval_status === "requested" || r.approval_status === "pending_cover",
  ).length;
  const criticalUnderstaffingCount = rows.filter(
    (r) => r.staffing_impact === "critical_understaffing",
  ).length;
  const noCoverCount = rows.filter((r) => !r.cover_confirmed).length;

  // Non-cancelled rows for approved_rate
  const nonCancelled = rows.filter((r) => r.approval_status !== "cancelled");
  const approvedCount = nonCancelled.filter((r) => r.approval_status === "approved").length;

  const boolRate = (field: keyof StaffAnnualLeaveRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const approvedRate =
    nonCancelled.length > 0
      ? Math.round((approvedCount / nonCancelled.length) * 1000) / 10
      : 0;

  const leaveTypeBreakdown: Record<string, number> = {};
  for (const r of rows) leaveTypeBreakdown[r.leave_type] = (leaveTypeBreakdown[r.leave_type] ?? 0) + 1;

  const impactBreakdown: Record<string, number> = {};
  for (const r of rows) impactBreakdown[r.staffing_impact] = (impactBreakdown[r.staffing_impact] ?? 0) + 1;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  return {
    total_requests: rows.length,
    declined_count: declinedCount,
    pending_count: pendingCount,
    critical_understaffing_count: criticalUnderstaffingCount,
    no_cover_count: noCoverCount,
    cover_confirmed_rate: boolRate("cover_confirmed"),
    handover_completed_rate: boolRate("handover_completed"),
    children_informed_rate: boolRate("children_informed"),
    minimum_staffing_rate: boolRate("minimum_staffing_maintained"),
    approved_rate: approvedRate,
    leave_type_breakdown: leaveTypeBreakdown,
    impact_breakdown: impactBreakdown,
    unique_staff: uniqueStaff,
  };
}

export function computeStaffAnnualLeaveAlerts(
  rows: StaffAnnualLeaveRow[],
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

  // Critical: approved + critical_understaffing + minimum staffing not maintained
  for (const r of rows) {
    if (
      r.approval_status === "approved" &&
      r.staffing_impact === "critical_understaffing" &&
      !r.minimum_staffing_maintained
    ) {
      alerts.push({
        type: "critical_understaffing_approved",
        severity: "critical",
        message: `${r.staff_name}'s approved leave (${r.start_date} to ${r.end_date}) creates critical understaffing with minimum staffing not maintained — immediate review required`,
        record_id: r.id,
      });
    }
  }

  // High: approved + no cover confirmed
  for (const r of rows) {
    if (r.approval_status === "approved" && !r.cover_confirmed) {
      alerts.push({
        type: "approved_no_cover",
        severity: "high",
        message: `${r.staff_name}'s approved leave (${r.start_date} to ${r.end_date}) has no cover confirmed — arrange cover before leave begins`,
        record_id: r.id,
      });
    }
  }

  // High: multiple overlapping leave periods
  const approvedRows = rows.filter((r) => r.approval_status === "approved");
  for (let i = 0; i < approvedRows.length; i++) {
    for (let j = i + 1; j < approvedRows.length; j++) {
      const a = approvedRows[i];
      const b = approvedRows[j];
      if (a.start_date <= b.end_date && b.start_date <= a.end_date) {
        alerts.push({
          type: "overlapping_leave",
          severity: "high",
          message: `Overlapping approved leave: ${a.staff_name} (${a.start_date} to ${a.end_date}) and ${b.staff_name} (${b.start_date} to ${b.end_date}) — review staffing impact`,
        });
      }
    }
  }

  // Medium: handover not completed for approved leave
  for (const r of rows) {
    if (r.approval_status === "approved" && !r.handover_completed) {
      alerts.push({
        type: "handover_not_completed",
        severity: "medium",
        message: `${r.staff_name}'s approved leave (${r.start_date} to ${r.end_date}) has no handover completed — ensure handover is done before leave starts`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateStaffAnnualLeaveCaraInsights(
  metrics: ReturnType<typeof computeStaffAnnualLeaveMetrics>,
  alerts: ReturnType<typeof computeStaffAnnualLeaveAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (pink-themed)
  const approvedPct = metrics.approved_rate;
  insights.push(
    `[pink] ${metrics.total_requests} leave requests across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `Approved rate: ${approvedPct}%. ` +
      `Cover confirmed rate: ${metrics.cover_confirmed_rate}%. ` +
      `Minimum staffing maintained rate: ${metrics.minimum_staffing_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Handover completed rate: ${metrics.handover_completed_rate}%. ` +
        `Children informed rate: ${metrics.children_informed_rate}%. ` +
        `Critical understaffing count: ${metrics.critical_understaffing_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `Handover completed rate: ${metrics.handover_completed_rate}%. ` +
        `Children informed rate: ${metrics.children_informed_rate}%. ` +
        `Critical understaffing count: ${metrics.critical_understaffing_count}.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Are leave arrangements being managed to ensure continuity of care for children, ` +
      `and are children informed and prepared for changes in their key staff?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export function listStaffAnnualLeave(
  homeId: string,
): Promise<ServiceResult<StaffAnnualLeaveRow[]>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: true, data: [] });

  const q = (
    (createServerClient() as unknown as SB) as any
  ).from("cs_staff_annual_leave").select("*").eq("home_id", homeId)
    .order("created_at", { ascending: false }).limit(200);

  return q.then(({ data, error }: { data: StaffAnnualLeaveRow[] | null; error: { message: string } | null }) => {
    if (error) return { ok: false, error: error.message } as ServiceResult<StaffAnnualLeaveRow[]>;
    return { ok: true, data: data ?? [] } as ServiceResult<StaffAnnualLeaveRow[]>;
  });
}

export function createStaffAnnualLeave(payload: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  approvalStatus: ApprovalStatus;
  coverArrangement: CoverArrangement;
  staffingImpact: StaffingImpact;
  daysRequested: number;
  approvedBy?: string | null;
  coverConfirmed?: boolean;
  handoverCompleted?: boolean;
  childrenInformed?: boolean;
  minimumStaffingMaintained?: boolean;
  entitlementRemaining?: number | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffAnnualLeaveRow>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: false, error: "Supabase not configured" });

  const s = createServerClient() as unknown as SB;

  return ((s as any).from("cs_staff_annual_leave") as any)
    .insert({
      home_id: payload.homeId,
      staff_name: payload.staffName,
      staff_id: payload.staffId ?? null,
      start_date: payload.startDate,
      end_date: payload.endDate,
      leave_type: payload.leaveType,
      approval_status: payload.approvalStatus,
      cover_arrangement: payload.coverArrangement,
      staffing_impact: payload.staffingImpact,
      days_requested: payload.daysRequested,
      approved_by: payload.approvedBy ?? null,
      cover_confirmed: payload.coverConfirmed ?? false,
      handover_completed: payload.handoverCompleted ?? false,
      children_informed: payload.childrenInformed ?? false,
      minimum_staffing_maintained: payload.minimumStaffingMaintained ?? false,
      entitlement_remaining: payload.entitlementRemaining ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single()
    .then(({ data, error }: { data: StaffAnnualLeaveRow | null; error: { message: string } | null }) => {
      if (error) return { ok: false, error: error.message } as ServiceResult<StaffAnnualLeaveRow>;
      return { ok: true, data: data! } as ServiceResult<StaffAnnualLeaveRow>;
    });
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffAnnualLeaveMetrics,
  computeStaffAnnualLeaveAlerts,
  generateStaffAnnualLeaveCaraInsights,
};
