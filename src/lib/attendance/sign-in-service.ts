// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Smart Sign-In (Phase 3)
//
// The missing self-service clock-in / clock-out write path. The Shift model already
// carries clock_in_at / clock_out_at / actual_start / actual_end / status, and
// isOnShift() (Comms) already READS them — but nothing WROTE them until now. This
// service lets the signed-in staff member clock into / out of their own shift,
// making "on shift" a real, current fact (the foundation Phase 4 builds on).
//
// Deliberately NOT in scope (per the brief): no biometrics (face / fingerprint),
// no continuous location tracking — sign-in is an authenticated action only.
// Geofence / QR / kiosk is a separate later phase.
//
// Pure cores (lateness / duration / shift-type) take an injected `now` so they are
// deterministic and unit-tested; only clockIn/clockOut touch the store + audit.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { writeAuditLog } from "@/lib/supabase/audit";
import type { Shift } from "@/types";
import type { ShiftType } from "@/lib/constants";

const DEFAULT_USER_ID = "staff_darren";
const DEFAULT_HOME = "home_oak";

// ── Identity ──────────────────────────────────────────────────────────────────

export interface SignInStaff {
  id: string;
  name: string;
  role: string;
  home_id: string;
}

/** Resolve the acting staff member from the request (header → staff record). */
export function resolveSignInStaff(headers: { get(name: string): string | null }): SignInStaff {
  const id = headers.get("x-user-id") || DEFAULT_USER_ID;
  const staff = (db.staff?.findAll?.() ?? []).find((s: { id: string }) => s.id === id) as
    | { id: string; full_name?: string; first_name?: string; role?: string; home_id?: string }
    | undefined;
  return {
    id,
    name: staff?.full_name || staff?.first_name || id,
    role: staff?.role ?? "residential_care_worker",
    home_id: staff?.home_id ?? DEFAULT_HOME,
  };
}

// ── Pure helpers (deterministic) ──────────────────────────────────────────────

const ISO_DATE = (iso: string) => iso.slice(0, 10);

/** Build a comparable instant from a shift date (YYYY-MM-DD) + wall time (HH:MM). */
export function scheduledInstant(date: string, hhmm: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const ms = Date.parse(`${date}T${hhmm}:00.000Z`);
  return Number.isNaN(ms) ? null : ms;
}

/** Minutes a clock-in is later than the scheduled start (0 if on time or early). */
export function computeLatenessMinutes(date: string, scheduledStart: string, clockInIso: string): number {
  const sched = scheduledInstant(date, scheduledStart);
  const actual = Date.parse(clockInIso);
  if (sched === null || Number.isNaN(actual)) return 0;
  return Math.max(0, Math.round((actual - sched) / 60000));
}

/** Whole minutes between two ISO instants (>= 0). */
export function minutesBetween(startIso: string, endIso: string): number {
  const a = Date.parse(startIso), b = Date.parse(endIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 60000));
}

/** Overtime = minutes worked beyond the scheduled end (0 if none). */
export function computeOvertimeMinutes(date: string, scheduledEnd: string, clockOutIso: string): number {
  let sched = scheduledInstant(date, scheduledEnd);
  const actual = Date.parse(clockOutIso);
  if (sched === null || Number.isNaN(actual)) return 0;
  // Overnight shift: end time earlier than start rolls to the next day.
  if (actual - sched < -12 * 3600_000) sched += 24 * 3600_000;
  return Math.max(0, Math.round((actual - sched) / 60000));
}

/** Infer a sensible shift type for an ad-hoc (unscheduled) sign-in by hour. */
export function inferShiftType(nowIso: string): ShiftType {
  const hour = new Date(Date.parse(nowIso)).getUTCHours();
  if (hour >= 22 || hour < 7) return "waking_night";
  return "day";
}

// ── Shift selection ───────────────────────────────────────────────────────────

const CLOCKABLE_STATUSES = new Set(["scheduled", "confirmed", "in_progress"]);

/**
 * The staff member's clock-in-able shift today: not cancelled / no-show / already
 * clocked-out. Prefer one already in progress, then the earliest scheduled.
 */
export function pickTodayShift(staffId: string, nowIso: string): Shift | null {
  const today = ISO_DATE(nowIso);
  const mine = db.shifts
    .findByStaff(staffId)
    .filter((s) => s.date === today && !s.clock_out_at && CLOCKABLE_STATUSES.has(s.status));
  if (mine.length === 0) return null;
  mine.sort((a, b) => {
    // in_progress first, then earliest scheduled start
    const ap = a.status === "in_progress" ? 0 : 1;
    const bp = b.status === "in_progress" ? 0 : 1;
    return ap - bp || (a.start_time || "").localeCompare(b.start_time || "");
  });
  return mine[0];
}

// ── Status (the "smart" briefing) ─────────────────────────────────────────────

export interface ColleagueOnShift {
  staff_id: string;
  name: string;
  role: string;
  shift_type: ShiftType;
  clock_in_at: string | null;
}

export interface SignInStatus {
  staff_id: string;
  home_id: string;
  /** Currently clocked in (in_progress / clock_in set, not yet out). */
  on_shift: boolean;
  shift: Shift | null;
  clock_in_at: string | null;
  /** Minutes since clock-in (when on shift). */
  on_shift_minutes: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  /** Lateness at clock-in (0 if on time, when applicable). */
  late_minutes: number;
  /** Whether a shift is scheduled today to clock into. */
  has_shift_today: boolean;
  /** Other staff currently on shift in the same home (context on sign-in). */
  colleagues_on_shift: ColleagueOnShift[];
  /** Total staff currently clocked in (including this user if on shift). */
  staffing_count: number;
}

function isClockedIn(s: Shift): boolean {
  return s.status === "in_progress" || (!!s.clock_in_at && !s.clock_out_at);
}

/** Build the full sign-in status + smart context for a staff member. */
export function buildSignInStatus(staffId: string, nowIso: string): SignInStatus {
  const staff = resolveSignInStaff({ get: (n) => (n === "x-user-id" ? staffId : null) });
  const today = ISO_DATE(nowIso);
  const todays = db.shifts.findAll().filter((s) => s.date === today);

  const myActive = db.shifts
    .findByStaff(staffId)
    .find((s) => s.date === today && isClockedIn(s));
  const myShift = myActive ?? pickTodayShift(staffId, nowIso);

  const staffNames = new Map(
    (db.staff?.findAll?.() ?? []).map((s: { id: string; full_name?: string; first_name?: string }) => [
      s.id,
      s.full_name || s.first_name || s.id,
    ]),
  );

  const onShiftShifts = todays.filter(
    (s) => isClockedIn(s) && (s.home_id ?? DEFAULT_HOME) === staff.home_id,
  );
  const colleagues: ColleagueOnShift[] = onShiftShifts
    .filter((s) => s.staff_id !== staffId)
    .map((s) => ({
      staff_id: s.staff_id,
      name: staffNames.get(s.staff_id) ?? s.staff_id,
      role: "",
      shift_type: s.shift_type,
      clock_in_at: s.clock_in_at,
    }));

  return {
    staff_id: staffId,
    home_id: staff.home_id,
    on_shift: !!myActive,
    shift: myShift,
    clock_in_at: myActive?.clock_in_at ?? null,
    on_shift_minutes: myActive?.clock_in_at ? minutesBetween(myActive.clock_in_at, nowIso) : 0,
    scheduled_start: myShift?.start_time ?? null,
    scheduled_end: myShift?.end_time ?? null,
    late_minutes:
      myActive?.clock_in_at && myShift
        ? computeLatenessMinutes(myShift.date, myShift.start_time, myActive.clock_in_at)
        : 0,
    has_shift_today: !!pickTodayShift(staffId, nowIso) || !!myActive,
    colleagues_on_shift: colleagues,
    staffing_count: onShiftShifts.length,
  };
}

// ── Clock in / out (mutating) ─────────────────────────────────────────────────

function audit(action: "create" | "update", staff: SignInStaff, shiftId: string, detail: Record<string, unknown>) {
  void writeAuditLog({
    home_id: staff.home_id,
    entity_type: "attendance.shift_sign_in",
    entity_id: shiftId,
    action,
    changes: detail,
    performed_by: staff.id,
  });
}

export interface ClockInResult {
  ok: boolean;
  already_on_shift: boolean;
  created_adhoc: boolean;
  shift: Shift;
  late_minutes: number;
}

/**
 * Clock the staff member into today's shift. If none is scheduled, create an ad-hoc
 * shift so cover/unscheduled work is still captured. Idempotent: a second clock-in
 * while already on shift returns the current shift unchanged.
 */
export function clockIn(staffId: string, nowIso: string, opts: { note?: string } = {}): ClockInResult {
  const staff = resolveSignInStaff({ get: (n) => (n === "x-user-id" ? staffId : null) });
  const today = ISO_DATE(nowIso);

  const existingActive = db.shifts
    .findByStaff(staffId)
    .find((s) => s.date === today && isClockedIn(s));
  if (existingActive) {
    return {
      ok: true,
      already_on_shift: true,
      created_adhoc: false,
      shift: existingActive,
      late_minutes: existingActive.clock_in_at
        ? computeLatenessMinutes(existingActive.date, existingActive.start_time, existingActive.clock_in_at)
        : 0,
    };
  }

  let shift = pickTodayShift(staffId, nowIso);
  let createdAdhoc = false;
  if (!shift) {
    // No scheduled shift — create an ad-hoc one for the cover/unscheduled work.
    const hhmm = new Date(Date.parse(nowIso)).toISOString().slice(11, 16);
    shift = db.shifts.create({
      staff_id: staffId,
      date: today,
      shift_type: inferShiftType(nowIso),
      start_time: hhmm,
      end_time: hhmm,
      break_minutes: 0,
      actual_start: null,
      actual_end: null,
      clock_in_at: null,
      clock_out_at: null,
      overtime_minutes: 0,
      notes: opts.note ?? "Ad-hoc sign-in (no scheduled shift)",
      status: "scheduled",
      is_open_shift: false,
      home_id: staff.home_id,
      created_by: staffId,
      updated_by: staffId,
    });
    createdAdhoc = true;
  }

  const updated =
    db.shifts.update(shift.id, {
      clock_in_at: nowIso,
      actual_start: nowIso,
      status: "in_progress",
      updated_by: staffId,
      ...(opts.note ? { notes: opts.note } : {}),
    }) ?? shift;

  const late = computeLatenessMinutes(updated.date, updated.start_time, nowIso);
  audit("update", staff, updated.id, { event: "clock_in", clock_in_at: nowIso, late_minutes: late, adhoc: createdAdhoc });
  return { ok: true, already_on_shift: false, created_adhoc: createdAdhoc, shift: updated, late_minutes: late };
}

export interface ClockOutResult {
  ok: boolean;
  was_on_shift: boolean;
  shift: Shift | null;
  duration_minutes: number;
  overtime_minutes: number;
}

/** Clock the staff member out of their current shift (completes it). */
export function clockOut(staffId: string, nowIso: string, opts: { note?: string } = {}): ClockOutResult {
  const staff = resolveSignInStaff({ get: (n) => (n === "x-user-id" ? staffId : null) });
  const today = ISO_DATE(nowIso);
  const active = db.shifts.findByStaff(staffId).find((s) => s.date === today && isClockedIn(s));
  if (!active) {
    return { ok: false, was_on_shift: false, shift: null, duration_minutes: 0, overtime_minutes: 0 };
  }
  const startIso = active.clock_in_at ?? active.actual_start ?? nowIso;
  const duration = minutesBetween(startIso, nowIso);
  const overtime = computeOvertimeMinutes(active.date, active.end_time, nowIso);
  const updated =
    db.shifts.update(active.id, {
      clock_out_at: nowIso,
      actual_end: nowIso,
      status: "completed",
      overtime_minutes: overtime,
      updated_by: staffId,
      ...(opts.note ? { notes: opts.note } : {}),
    }) ?? active;
  audit("update", staff, updated.id, { event: "clock_out", clock_out_at: nowIso, duration_minutes: duration, overtime_minutes: overtime });
  return { ok: true, was_on_shift: true, shift: updated, duration_minutes: duration, overtime_minutes: overtime };
}
