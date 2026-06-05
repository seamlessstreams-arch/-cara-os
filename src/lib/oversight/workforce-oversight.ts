// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Workforce Oversight & Evidence (Phase 8)
//
// Read-only aggregation that turns what the workforce engine captured (sign-in /
// presence — Phases 3/5, shift access — Phase 4, message governance — Phase 2,
// emergencies + safe staffing — Phase 7) into a management-oversight summary and an
// audit-ready evidence pack. Pure + deterministic (now/period injected) — it only
// SURFACES existing records; it never writes anything. Complements the existing
// care-records evidence generator (a different domain).
// ══════════════════════════════════════════════════════════════════════════════

import { computeLatenessMinutes } from "@/lib/attendance/sign-in-service";
import type { SignInVerification } from "@/lib/attendance/presence-verification";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";
import type { SafeStaffingAssessment } from "@/lib/staffing/safe-staffing";
import type { CommsMessageAction } from "@/types/comms";

export interface ShiftLike {
  staff_id: string;
  date: string;
  start_time: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
  home_id?: string;
}
export interface MessageLike {
  id: string;
  home_id: string;
  investigation_hold: boolean;
  retention_category: string;
  created_at: string;
  is_deleted: boolean;
}

export interface WorkforceOversightInput {
  homeId: string;
  nowIso: string;
  periodDays?: number; // default 7
  shifts: ShiftLike[];
  verifications: SignInVerification[];
  messageActions: CommsMessageAction[];
  messages: MessageLike[];
  emergencies: EmergencyAlert[];
  staffing: SafeStaffingAssessment;
}

export type OversightFlagSeverity = "info" | "attention" | "critical";
export interface OversightFlag {
  severity: OversightFlagSeverity;
  label: string;
}

export interface WorkforceOversight {
  home_id: string;
  generated_at: string;
  period_days: number;
  attendance: {
    clock_ins_today: number;
    currently_on_shift: number;
    late_today: number;
  };
  presence: {
    total: number;
    verified: number;
    unverified: number;
    by_method: Record<string, number>;
  };
  governance: {
    conversions_total: number;
    conversions_by_type: Record<string, number>;
    active_investigation_holds: number;
    retained_non_routine: number;
  };
  emergencies: {
    raised: number;
    active: number;
    resolved: number;
    total_responders: number;
  };
  staffing: {
    severity: SafeStaffingAssessment["severity"];
    on_shift_count: number;
    minimum_required: number;
    open_alerts: number;
  };
  /** Things an overseer should look at, worst first. */
  flags: OversightFlag[];
}

const isClockedIn = (s: ShiftLike) => s.status === "in_progress" || (!!s.clock_in_at && !s.clock_out_at);

function tally<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = key(it);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Pure: build the workforce oversight summary. */
export function buildWorkforceOversight(input: WorkforceOversightInput): WorkforceOversight {
  const periodDays = input.periodDays ?? 7;
  const today = input.nowIso.slice(0, 10);
  const periodStart = new Date(Date.parse(input.nowIso) - periodDays * 86400_000).toISOString();
  const inHome = <T extends { home_id?: string }>(x: T) => (x.home_id ?? input.homeId) === input.homeId;
  const inPeriod = (iso: string) => iso >= periodStart;

  // ── Attendance (today) ──
  const todays = input.shifts.filter((s) => s.date === today && (s.home_id ?? input.homeId) === input.homeId);
  const clockedToday = todays.filter((s) => s.clock_in_at);
  const attendance = {
    clock_ins_today: clockedToday.length,
    currently_on_shift: todays.filter(isClockedIn).length,
    late_today: clockedToday.filter((s) => s.clock_in_at && computeLatenessMinutes(s.date, s.start_time, s.clock_in_at) > 0).length,
  };

  // ── Presence (period) ──
  const verifs = input.verifications.filter((v) => inHome(v) && inPeriod(v.created_at));
  const presence = {
    total: verifs.length,
    verified: verifs.filter((v) => v.verified).length,
    unverified: verifs.filter((v) => !v.verified).length,
    by_method: tally(verifs, (v) => v.method),
  };

  // ── Governance (period) ──
  const actions = input.messageActions.filter((a) => inPeriod(a.created_at));
  const homeMessages = input.messages.filter((m) => inHome(m));
  const governance = {
    conversions_total: actions.length,
    conversions_by_type: tally(actions, (a) => a.action_type),
    active_investigation_holds: homeMessages.filter((m) => m.investigation_hold && !m.is_deleted).length,
    retained_non_routine: homeMessages.filter((m) => m.retention_category && m.retention_category !== "routine_messages").length,
  };

  // ── Emergencies (period) ──
  const emergs = input.emergencies.filter((e) => inHome(e) && inPeriod(e.created_at));
  const emergencies = {
    raised: emergs.length,
    active: emergs.filter((e) => e.status === "active").length,
    resolved: emergs.filter((e) => e.status === "resolved").length,
    total_responders: emergs.reduce((n, e) => n + e.responders.length, 0),
  };

  // ── Staffing (current) ──
  const staffing = {
    severity: input.staffing.severity,
    on_shift_count: input.staffing.on_shift_count,
    minimum_required: input.staffing.minimum_required,
    open_alerts: input.staffing.alerts.length,
  };

  // ── Flags (worst first) ──
  const flags: OversightFlag[] = [];
  if (emergencies.active > 0) flags.push({ severity: "critical", label: `${emergencies.active} active emergency alert(s)` });
  if (staffing.severity === "critical") flags.push({ severity: "critical", label: "Safe staffing: action needed now" });
  else if (staffing.severity === "high") flags.push({ severity: "attention", label: "Safe staffing: check cover" });
  if (governance.active_investigation_holds > 0) flags.push({ severity: "attention", label: `${governance.active_investigation_holds} message(s) under investigation hold` });
  if (presence.unverified > 0) flags.push({ severity: "attention", label: `${presence.unverified} unverified sign-in(s) this period` });
  if (attendance.late_today > 0) flags.push({ severity: "info", label: `${attendance.late_today} late clock-in(s) today` });
  const order: Record<OversightFlagSeverity, number> = { critical: 0, attention: 1, info: 2 };
  flags.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    home_id: input.homeId,
    generated_at: input.nowIso,
    period_days: periodDays,
    attendance,
    presence,
    governance,
    emergencies,
    staffing,
    flags,
  };
}
