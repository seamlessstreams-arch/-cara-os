// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT MONITORING SERVICE
// Manages waking night duties, sleep/welfare checks on children, night shift
// logs, and overnight incident tracking. CHR 2015 Reg 12 (protection of
// children), Reg 25 (premises and environment — night safety), Reg 32/33
// (fitness of workers — night staffing), Quality Standards Guide.
//
// Tracks individual child checks at required intervals, overall shift records
// including handovers, premises security, fire panel status, and disturbance
// counts — ensuring children's homes maintain safe overnight environments
// and meet statutory night monitoring duties.
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

export type CheckType =
  | "routine_sleep"
  | "welfare_check"
  | "requested_check"
  | "disturbance_response"
  | "medical_check";

export type ChildStatus =
  | "sleeping"
  | "awake_settled"
  | "awake_unsettled"
  | "not_in_room"
  | "distressed"
  | "medical_attention";

export type ResponseAction =
  | "reassured"
  | "spoken_to"
  | "medication_given"
  | "incident_reported"
  | "manager_called"
  | "no_action_needed";

export type NightLogStatus =
  | "in_progress"
  | "completed"
  | "reviewed";

export interface NightCheck {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  check_time: string;
  checked_by: string;
  check_type: CheckType;
  child_status: ChildStatus;
  response_action: ResponseAction | null;
  notes: string | null;
  created_at: string;
}

export interface NightLog {
  id: string;
  home_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string | null;
  staff_on_duty: { name: string; role: string }[];
  lead_staff: string;
  handover_received: boolean;
  handover_notes: string | null;
  total_checks_completed: number;
  all_children_checked: boolean;
  incidents_count: number;
  disturbances_count: number;
  premises_secure: boolean;
  fire_panel_checked: boolean;
  overnight_summary: string;
  handover_given: boolean;
  handover_given_notes: string | null;
  status: NightLogStatus;
  reviewed_by: string | null;
  reviewed_date: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CHECK_TYPES: { type: CheckType; label: string }[] = [
  { type: "routine_sleep", label: "Routine Sleep Check" },
  { type: "welfare_check", label: "Welfare Check" },
  { type: "requested_check", label: "Requested Check" },
  { type: "disturbance_response", label: "Disturbance Response" },
  { type: "medical_check", label: "Medical Check" },
];

export const CHILD_STATUSES: { status: ChildStatus; label: string }[] = [
  { status: "sleeping", label: "Sleeping" },
  { status: "awake_settled", label: "Awake — Settled" },
  { status: "awake_unsettled", label: "Awake — Unsettled" },
  { status: "not_in_room", label: "Not in Room" },
  { status: "distressed", label: "Distressed" },
  { status: "medical_attention", label: "Medical Attention" },
];

export const RESPONSE_ACTIONS: { action: ResponseAction; label: string }[] = [
  { action: "reassured", label: "Reassured" },
  { action: "spoken_to", label: "Spoken To" },
  { action: "medication_given", label: "Medication Given" },
  { action: "incident_reported", label: "Incident Reported" },
  { action: "manager_called", label: "Manager Called" },
  { action: "no_action_needed", label: "No Action Needed" },
];

export const NIGHT_LOG_STATUSES: { status: NightLogStatus; label: string }[] = [
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "reviewed", label: "Reviewed" },
];

export const MINIMUM_CHECK_FREQUENCY_HOURS: number = 2;

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across night checks and shift logs.
 */
export function computeNightMonitoringMetrics(
  checks: NightCheck[],
  logs: NightLog[],
): {
  total_checks_last_7d: number;
  avg_checks_per_night: number;
  all_children_checked_rate: number;
  disturbance_count: number;
  incidents_count: number;
  by_child_status: Record<string, number>;
  by_check_type: Record<string, number>;
  premises_secure_rate: number;
  handover_completion_rate: number;
  unreviewed_logs_count: number;
} {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Checks in last 7 days
  const recentChecks = checks.filter(
    (c) => new Date(c.check_time).getTime() >= sevenDaysAgo.getTime(),
  );
  const totalChecksLast7d = recentChecks.length;

  // Average checks per night (from logs that have total_checks_completed)
  let totalChecksFromLogs = 0;
  let logsWithChecks = 0;
  for (const log of logs) {
    totalChecksFromLogs += log.total_checks_completed;
    logsWithChecks++;
  }
  const avgChecksPerNight =
    logsWithChecks > 0
      ? Math.round((totalChecksFromLogs / logsWithChecks) * 10) / 10
      : 0;

  // All children checked rate
  let allChildrenCheckedCount = 0;
  for (const log of logs) {
    if (log.all_children_checked) {
      allChildrenCheckedCount++;
    }
  }
  const allChildrenCheckedRate =
    logs.length > 0
      ? Math.round((allChildrenCheckedCount / logs.length) * 1000) / 10
      : 0;

  // Disturbance and incident counts from logs
  let disturbanceCount = 0;
  let incidentsCount = 0;
  for (const log of logs) {
    disturbanceCount += log.disturbances_count;
    incidentsCount += log.incidents_count;
  }

  // By child status breakdown
  const byChildStatus: Record<string, number> = {};
  for (const c of checks) {
    byChildStatus[c.child_status] = (byChildStatus[c.child_status] ?? 0) + 1;
  }

  // By check type breakdown
  const byCheckType: Record<string, number> = {};
  for (const c of checks) {
    byCheckType[c.check_type] = (byCheckType[c.check_type] ?? 0) + 1;
  }

  // Premises secure rate
  let premisesSecureCount = 0;
  for (const log of logs) {
    if (log.premises_secure) {
      premisesSecureCount++;
    }
  }
  const premisesSecureRate =
    logs.length > 0
      ? Math.round((premisesSecureCount / logs.length) * 1000) / 10
      : 0;

  // Handover completion rate (both received and given)
  let handoverCompleteCount = 0;
  for (const log of logs) {
    if (log.handover_received && log.handover_given) {
      handoverCompleteCount++;
    }
  }
  const handoverCompletionRate =
    logs.length > 0
      ? Math.round((handoverCompleteCount / logs.length) * 1000) / 10
      : 0;

  // Unreviewed logs
  let unreviewedLogsCount = 0;
  for (const log of logs) {
    if (log.status !== "reviewed") {
      unreviewedLogsCount++;
    }
  }

  return {
    total_checks_last_7d: totalChecksLast7d,
    avg_checks_per_night: avgChecksPerNight,
    all_children_checked_rate: allChildrenCheckedRate,
    disturbance_count: disturbanceCount,
    incidents_count: incidentsCount,
    by_child_status: byChildStatus,
    by_check_type: byCheckType,
    premises_secure_rate: premisesSecureRate,
    handover_completion_rate: handoverCompletionRate,
    unreviewed_logs_count: unreviewedLogsCount,
  };
}

/**
 * Identify alerts requiring management attention from night monitoring
 * checks and shift logs.
 */
export function identifyNightMonitoringAlerts(
  checks: NightCheck[],
  logs: NightLog[],
  childrenCount: number,
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];
  const now = new Date();

  const twoHoursMs = MINIMUM_CHECK_FREQUENCY_HOURS * 60 * 60 * 1000;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // ── Check-level alerts ──────────────────────────────────────────────

  // Child not checked in 2+ hours — build latest check time per child
  const latestCheckByChild = new Map<string, number>();
  for (const c of checks) {
    const checkTime = new Date(c.check_time).getTime();
    const current = latestCheckByChild.get(c.child_id);
    if (!current || checkTime > current) {
      latestCheckByChild.set(c.child_id, checkTime);
    }
  }

  for (const [childId, lastCheckTime] of latestCheckByChild.entries()) {
    if (now.getTime() - lastCheckTime > twoHoursMs) {
      const hoursElapsed = Math.round(
        (now.getTime() - lastCheckTime) / (1000 * 60 * 60) * 10,
      ) / 10;
      alerts.push({
        type: "child_not_checked",
        severity: "critical",
        message: `Child has not been checked for ${hoursElapsed} hours — Reg 12 requires checks at least every ${MINIMUM_CHECK_FREQUENCY_HOURS} hours`,
        id: childId,
      });
    }
  }

  // Child distressed — any check where child_status is distressed
  for (const c of checks) {
    if (c.child_status === "distressed") {
      alerts.push({
        type: "child_distressed",
        severity: "high",
        message: `${c.child_name} found distressed during ${c.check_type.replace(/_/g, " ")} at ${c.check_time} — welfare follow-up required`,
        id: c.id,
      });
    }
  }

  // ── Log-level alerts ────────────────────────────────────────────────

  for (const log of logs) {
    // Shift with no checks recorded — critical
    if (log.total_checks_completed === 0 && log.status !== "in_progress") {
      alerts.push({
        type: "shift_no_checks",
        severity: "critical",
        message: `Night shift on ${log.shift_date} completed with no checks recorded — Reg 12 breach`,
        id: log.id,
      });
    }

    // In-progress shift with no checks (shift started but 0 checks so far)
    if (
      log.total_checks_completed === 0 &&
      log.status === "in_progress" &&
      log.shift_start
    ) {
      const shiftStartTime = new Date(log.shift_start).getTime();
      if (now.getTime() - shiftStartTime > twoHoursMs) {
        alerts.push({
          type: "shift_no_checks",
          severity: "critical",
          message: `Night shift started ${Math.round((now.getTime() - shiftStartTime) / (1000 * 60 * 60))} hours ago with no checks recorded — Reg 12 requires regular monitoring`,
          id: log.id,
        });
      }
    }

    // Premises not secured — critical
    if (!log.premises_secure) {
      alerts.push({
        type: "premises_not_secured",
        severity: "critical",
        message: `Premises not recorded as secure on ${log.shift_date} — Reg 25 requires safe overnight environment`,
        id: log.id,
      });
    }

    // Fire panel not checked — high
    if (!log.fire_panel_checked) {
      alerts.push({
        type: "fire_panel_not_checked",
        severity: "high",
        message: `Fire panel not checked on ${log.shift_date} — fire safety protocol requires nightly verification`,
        id: log.id,
      });
    }

    // Handover not received — high
    if (!log.handover_received) {
      alerts.push({
        type: "handover_not_received",
        severity: "high",
        message: `Handover not received for night shift on ${log.shift_date} — continuity of care at risk`,
        id: log.id,
      });
    }

    // Overnight log not completed (status still in_progress and shift_end is set) — high
    if (log.status === "in_progress" && log.shift_end) {
      alerts.push({
        type: "log_not_completed",
        severity: "high",
        message: `Night log for ${log.shift_date} has not been completed despite shift ending — overnight summary required`,
        id: log.id,
      });
    }

    // Unreviewed log > 48 hours — medium
    if (log.status === "completed" && log.updated_at) {
      const completedTime = new Date(log.updated_at).getTime();
      if (now.getTime() - completedTime > fortyEightHoursMs) {
        const hoursElapsed = Math.round(
          (now.getTime() - completedTime) / (1000 * 60 * 60),
        );
        alerts.push({
          type: "unreviewed_log",
          severity: "medium",
          message: `Completed night log for ${log.shift_date} has not been reviewed for ${hoursElapsed} hours — management review required within 48 hours`,
          id: log.id,
        });
      }
    }

    // High disturbance count > 3 per night — medium
    if (log.disturbances_count > 3) {
      alerts.push({
        type: "high_disturbance_count",
        severity: "medium",
        message: `${log.disturbances_count} disturbances recorded on ${log.shift_date} — pattern review recommended`,
        id: log.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Night Checks ─────────────────────────────────────────────────

export async function listNightChecks(
  homeId: string,
  filters?: {
    childId?: string;
    checkType?: CheckType;
    childStatus?: ChildStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<NightCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_night_checks") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.childStatus) q = q.eq("child_status", filters.childStatus);
  if (filters?.dateFrom) q = q.gte("check_time", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("check_time", filters.dateTo);
  q = q.order("check_time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createNightCheck(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    checkTime: string;
    checkedBy: string;
    checkType: CheckType;
    childStatus: ChildStatus;
    responseAction?: ResponseAction;
    notes?: string;
  },
): Promise<ServiceResult<NightCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_night_checks") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      check_time: input.checkTime,
      checked_by: input.checkedBy,
      check_type: input.checkType,
      child_status: input.childStatus,
      response_action: input.responseAction ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Night Logs ───────────────────────────────────────────────────

export async function listNightLogs(
  homeId: string,
  filters?: {
    status?: NightLogStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<NightLog[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_night_logs") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("shift_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("shift_date", filters.dateTo);
  q = q.order("shift_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createNightLog(
  input: {
    homeId: string;
    shiftDate: string;
    shiftStart: string;
    shiftEnd?: string;
    staffOnDuty: { name: string; role: string }[];
    leadStaff: string;
    handoverReceived?: boolean;
    handoverNotes?: string;
    totalChecksCompleted?: number;
    allChildrenChecked?: boolean;
    incidentsCount?: number;
    disturbancesCount?: number;
    premisesSecure?: boolean;
    firePanelChecked?: boolean;
    overnightSummary?: string;
    handoverGiven?: boolean;
    handoverGivenNotes?: string;
  },
): Promise<ServiceResult<NightLog>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_night_logs") as SB)
    .insert({
      home_id: input.homeId,
      shift_date: input.shiftDate,
      shift_start: input.shiftStart,
      shift_end: input.shiftEnd ?? null,
      staff_on_duty: input.staffOnDuty,
      lead_staff: input.leadStaff,
      handover_received: input.handoverReceived ?? false,
      handover_notes: input.handoverNotes ?? null,
      total_checks_completed: input.totalChecksCompleted ?? 0,
      all_children_checked: input.allChildrenChecked ?? false,
      incidents_count: input.incidentsCount ?? 0,
      disturbances_count: input.disturbancesCount ?? 0,
      premises_secure: input.premisesSecure ?? true,
      fire_panel_checked: input.firePanelChecked ?? true,
      overnight_summary: input.overnightSummary ?? "",
      handover_given: input.handoverGiven ?? false,
      handover_given_notes: input.handoverGivenNotes ?? null,
      status: "in_progress",
      reviewed_by: null,
      reviewed_date: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateNightLog(
  id: string,
  updates: Partial<NightLog>,
): Promise<ServiceResult<NightLog>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_night_logs") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNightMonitoringMetrics,
  identifyNightMonitoringAlerts,
};
