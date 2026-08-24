// ══════════════════════════════════════════════════════════════════════════════
// CARA — Smart Sign-In (Phase 3)
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
import { londonDateStr } from "@/lib/utils";
import { writeAuditLog } from "@/lib/supabase/audit";
import { verifyPresence, type PresenceMethod, type PresenceResult, type PresenceBand } from "./presence-verification";
import { persistSignInVerification } from "@/lib/supabase/workforce";
import type { Shift } from "@/types";
import type { ShiftType } from "@/lib/constants";

export interface PresenceVerificationInput {
  method: PresenceMethod;
  /** Kiosk code (method = kiosk). */
  code?: string;
  /** One-time coordinates (method = geofence) — used for the check, never stored. */
  coords?: { lat: number; lng: number };
}

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

// The calendar date of an instant, IN LONDON — because that is the timezone
// shift.date is written in (todayStr() → londonDateStr()). Slicing the first
// ten characters off an ISO string gives the UTC date instead, and between
// 00:00 and 01:00 BST the two disagree: a staff member genuinely on shift was
// told "You can only access this while on shift", because their shift was
// filed under London's today and looked up under UTC's yesterday.
const ISO_DATE = (iso: string) => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? iso.slice(0, 10) : londonDateStr(new Date(ms));
};

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

/**
 * Overtime = minutes worked beyond the scheduled end (0 if none).
 *
 * The scheduled end is anchored to the shift's `date` (its start day). For an
 * overnight shift (end wall-time strictly before start, e.g. 22:00 → 07:00) the end
 * instant belongs to the *next* day, so we roll it forward by 24h before comparing.
 * Without the start time we can't tell an overnight end from a normal one — passing it
 * in is what makes a real waking-night clock-out compute correctly instead of ~24h of
 * phantom overtime. (`end === start`, an ad-hoc zero-length placeholder, is not rolled.)
 */
export function computeOvertimeMinutes(
  date: string,
  scheduledStart: string,
  scheduledEnd: string,
  clockOutIso: string,
): number {
  const start = scheduledInstant(date, scheduledStart);
  let end = scheduledInstant(date, scheduledEnd);
  const actual = Date.parse(clockOutIso);
  if (start === null || end === null || Number.isNaN(actual)) return 0;
  if (end < start) end += 24 * 3600_000; // overnight: scheduled end is the following day
  return Math.max(0, Math.round((actual - end) / 60000));
}

/** Infer a sensible shift type for an ad-hoc (unscheduled) sign-in by hour. */
export function inferShiftType(nowIso: string): ShiftType {
  const hour = new Date(Date.parse(nowIso)).getUTCHours();
  if (hour >= 22 || hour < 7) return "waking_night";
  return "day";
}

// ── Shift selection ───────────────────────────────────────────────────────────

/** A shift whose wall-clock end is strictly before its start crosses midnight (e.g. 22:00 → 07:00). */
function isOvernight(s: Shift): boolean {
  return !!s.start_time && !!s.end_time && s.end_time < s.start_time;
}

/** The calendar date (YYYY-MM-DD) one day before the given instant. */
function prevDate(nowIso: string): string {
  const ms = Date.parse(nowIso);
  return Number.isNaN(ms) ? ISO_DATE(nowIso) : londonDateStr(new Date(ms - 86_400_000));
}

/**
 * The staff member's currently-active shift: clocked in and not yet out, dated either
 * today OR an overnight shift that started yesterday and is still open (the worker is
 * mid-shift after midnight). This is the single "active shift" lookup every on-shift
 * check shares — without the overnight arm, waking-night staff silently drop off shift
 * at 00:00 and cannot clock out the next morning (their shift is stored under day one).
 */
function findActiveShift(staffId: string, nowIso: string): Shift | undefined {
  const today = ISO_DATE(nowIso);
  const yesterday = prevDate(nowIso);
  return db.shifts
    .findByStaff(staffId)
    .find((s) => isClockedIn(s) && (s.date === today || (s.date === yesterday && isOvernight(s))));
}

/**
 * Canonical "is this staff member on shift right now?" — clocked in and not yet out on
 * today's shift, or still mid-overnight-shift after midnight. The single source of
 * on-shift truth (Comms + Phase 4 access both use it; sign-in keeps it current).
 */
export function isStaffOnShift(staffId: string, nowIso?: string): boolean {
  return !!findActiveShift(staffId, nowIso ?? new Date().toISOString());
}

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
  /** Presence verification on the active shift (no coordinates), if any. */
  presence: { method: PresenceMethod; verified: boolean; band: PresenceBand | null } | null;
}

function isClockedIn(s: Shift): boolean {
  return s.status === "in_progress" || (!!s.clock_in_at && !s.clock_out_at);
}

/** Build the full sign-in status + smart context for a staff member. */
export function buildSignInStatus(staffId: string, nowIso: string): SignInStatus {
  const staff = resolveSignInStaff({ get: (n) => (n === "x-user-id" ? staffId : null) });
  const today = ISO_DATE(nowIso);
  const todays = db.shifts.findAll().filter((s) => s.date === today);

  const myActive = findActiveShift(staffId, nowIso);
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
    presence: (() => {
      if (!myActive) return null;
      const v = db.signInVerifications.findByShift(myActive.id).slice(-1)[0];
      return v ? { method: v.method, verified: v.verified, band: v.band } : null;
    })(),
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
  /** Presence verification outcome (no coordinates) — null if none was supplied. */
  presence: PresenceResult | null;
}

/**
 * Clock the staff member into today's shift. If none is scheduled, create an ad-hoc
 * shift so cover/unscheduled work is still captured. Idempotent: a second clock-in
 * while already on shift returns the current shift unchanged.
 *
 * An optional presence verification (kiosk code / one-time geofence) is checked and
 * recorded as method + verified + coarse band — never raw coordinates.
 */
export function clockIn(
  staffId: string,
  nowIso: string,
  opts: { note?: string; verification?: PresenceVerificationInput } = {},
): ClockInResult {
  const staff = resolveSignInStaff({ get: (n) => (n === "x-user-id" ? staffId : null) });
  const today = ISO_DATE(nowIso);

  const existingActive = findActiveShift(staffId, nowIso);
  if (existingActive) {
    return {
      ok: true,
      already_on_shift: true,
      created_adhoc: false,
      shift: existingActive,
      late_minutes: existingActive.clock_in_at
        ? computeLatenessMinutes(existingActive.date, existingActive.start_time, existingActive.clock_in_at)
        : 0,
      presence: null,
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

  // Optional presence verification — checked once, stored as method/verified/band only.
  let presence: PresenceResult | null = null;
  if (opts.verification) {
    presence = verifyPresence({
      homeId: staff.home_id,
      method: opts.verification.method,
      code: opts.verification.code,
      coords: opts.verification.coords, // used for the check here, never persisted
      nowIso,
    });
    const verifRec = db.signInVerifications.create({
      staff_id: staffId,
      shift_id: updated.id,
      home_id: staff.home_id,
      method: presence.method,
      verified: presence.verified,
      band: presence.band,
    });
    void persistSignInVerification(verifRec); // durable persistence (no-op when Supabase off)
  }

  audit("update", staff, updated.id, {
    event: "clock_in",
    clock_in_at: nowIso,
    late_minutes: late,
    adhoc: createdAdhoc,
    ...(presence ? { presence_method: presence.method, presence_verified: presence.verified } : {}),
  });
  return { ok: true, already_on_shift: false, created_adhoc: createdAdhoc, shift: updated, late_minutes: late, presence };
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
  const active = findActiveShift(staffId, nowIso);
  if (!active) {
    return { ok: false, was_on_shift: false, shift: null, duration_minutes: 0, overtime_minutes: 0 };
  }
  const startIso = active.clock_in_at ?? active.actual_start ?? nowIso;
  const duration = minutesBetween(startIso, nowIso);
  const overtime = computeOvertimeMinutes(active.date, active.start_time, active.end_time, nowIso);
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
