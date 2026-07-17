// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR projection engine (pure)
//
// Builds one unified feed from the editable CalendarEvent collection PLUS a
// live projection of every other dated record in the store. Nothing is copied:
// projected items carry a source tag, a deep-link back to their module, and
// editable:false. Deterministic — all clock/range/resolver inputs are injected,
// so the whole thing is unit-testable without a store or a wall clock.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CalendarAttendee,
  CalendarEvent,
  CalendarFeed,
  CalendarItem,
  CalendarSource,
} from "./calendar-types";
import { ALL_CALENDAR_SOURCES } from "./calendar-types";
import { expandOccurrences, nextOccurrenceStart } from "./recurrence";

// ── Minimal shapes of the projected records (only the fields we read) ──────────
// Kept structural so the engine never depends on the full store types.

interface TaskLike {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  linked_child_id: string | null;
  assigned_to: string | null;
}
interface AppointmentLike {
  id: string;
  child_id: string;
  date: string;
  time: string;
  type: string;
  title: string;
  location: string;
  status: string;
}
interface SupervisionLike {
  id: string;
  staff_id: string;
  scheduled_date: string;
  type: string;
  status: string;
}
interface LacReviewLike {
  id: string;
  child_id: string;
  date: string;
  review_type: string;
  venue: string;
}
interface FamilyTimeLike {
  id: string;
  child_id: string;
  date: string;
  time: string;
  location: string;
}
interface InterviewLike {
  id: string;
  scheduled_at: string;
  interview_type: string;
  location: string | null;
}
interface TrainingLike {
  id: string;
  staff_id: string;
  course_name: string;
  expiry_date: string | null;
  status: string;
}
/** A configured circle in the home's rhythm. Structural, not compliance: it
 *  appears on the feed as an invitation, never as a task with a due date. */
interface CircleLike {
  id: string;
  kind: string;
  label: string;
  start: string;
  purpose: string;
}

interface KeyWorkingLike {
  id: string;
  child_id: string;
  staff_id: string;
  date: string;
  type: string;
}
interface ShiftLike {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
}

export interface CalendarProjectionInput {
  events: CalendarEvent[];
  tasks: TaskLike[];
  appointments: AppointmentLike[];
  supervisions: SupervisionLike[];
  lacReviews: LacReviewLike[];
  familyTime: FamilyTimeLike[];
  interviews: InterviewLike[];
  training: TrainingLike[];
  keyWorking: KeyWorkingLike[];
  shifts: ShiftLike[];
  /** Configured relational circles (doctrine 2.1.3). */
  circles: CircleLike[];
  /** id → display name, or null when unknown. */
  resolveChild: (id: string | null) => string | null;
  resolveStaff: (id: string | null) => string | null;
  /** Inclusive YYYY-MM-DD bounds. Omit for no filtering. */
  range?: { from: string; to: string };
  /** Which sources to include. Defaults to all. */
  sources?: CalendarSource[];
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)/;

/** Compose a naive-local ISO start from a date and optional HH:MM time. */
export function composeStart(date: string, time?: string | null): { start: string; all_day: boolean } {
  const day = (date ?? "").slice(0, 10);
  if (time && TIME_RE.test(time)) {
    return { start: `${day}T${time.slice(0, 5)}:00`, all_day: false };
  }
  return { start: `${day}T00:00:00`, all_day: true };
}

/** YYYY-MM-DD bucket key from an ISO datetime (or date). */
export function dayKey(iso: string): string {
  return (iso ?? "").slice(0, 10);
}

function inRange(date: string, range?: { from: string; to: string }): boolean {
  if (!range) return true;
  return date >= range.from && date <= range.to;
}

function addMinutesIso(start: string, minutes: number): string {
  // Naive arithmetic on the HH:MM portion; keeps the same day for shift ends.
  const m = start.match(/T(\d{2}):(\d{2})/);
  if (!m) return start;
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + minutes;
  const hh = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return start.replace(/T\d{2}:\d{2}/, `T${hh}:${mm}`);
}

function endFromTimes(date: string, endTime: string | null): string | null {
  if (!endTime || !TIME_RE.test(endTime)) return null;
  return `${date.slice(0, 10)}T${endTime.slice(0, 5)}:00`;
}

// ── Per-source projectors (each pure; never mutate input) ──────────────────────

/** Shift an event's end onto a different occurrence day, preserving time-of-day. */
function occurrenceEnd(e: CalendarEvent, occStart: string): string | null {
  if (!e.end) return null;
  return `${dayKey(occStart)}T${e.end.slice(11)}`;
}

function projectEvents(events: CalendarEvent[], input: CalendarProjectionInput): CalendarItem[] {
  const out: CalendarItem[] = [];
  for (const e of events) {
    if (e.status === "cancelled") continue;
    const recurrence = e.recurrence ?? null;
    // Expand recurring events across the visible window; one-offs stay as-is.
    // Without a range we can't bound an infinite series, so emit only the base.
    const starts =
      recurrence && input.range ? expandOccurrences(e.start, recurrence, input.range) : [e.start];
    for (const start of starts) {
      const occDay = dayKey(start);
      out.push({
        id: recurrence ? `cal_${e.id}__${occDay}` : `cal_${e.id}`,
        source: "calendar",
        title: e.title,
        start,
        end: recurrence ? occurrenceEnd(e, start) : e.end,
        all_day: e.all_day,
        date: occDay,
        event_type: e.event_type,
        child_id: e.child_id,
        child_name: input.resolveChild(e.child_id),
        staff_id: e.organiser_id,
        staff_name: input.resolveStaff(e.organiser_id),
        location: e.location,
        status: e.status,
        editable: true,
        href: `/calendar?event=${e.id}`,
        source_id: e.id,
        recurring: Boolean(recurrence),
      });
    }
  }
  return out;
}

function projectTasks(tasks: TaskLike[], input: CalendarProjectionInput): CalendarItem[] {
  const done = new Set(["completed", "cancelled", "done"]);
  return tasks
    .filter((t) => t.due_date && !done.has(t.status))
    .map((t) => {
      const { start, all_day } = composeStart(t.due_date as string);
      return {
        id: `task_${t.id}`,
        source: "task" as const,
        title: `Due: ${t.title}`,
        start,
        end: null,
        all_day,
        date: dayKey(start),
        event_type: "deadline" as const,
        child_id: t.linked_child_id,
        child_name: input.resolveChild(t.linked_child_id),
        staff_id: t.assigned_to,
        staff_name: input.resolveStaff(t.assigned_to),
        location: null,
        status: t.status,
        editable: false,
        href: "/tasks",
        source_id: t.id,
      };
    });
}

function projectAppointments(rows: AppointmentLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows.map((a) => {
    const { start, all_day } = composeStart(a.date, a.time);
    return {
      id: `appt_${a.id}`,
      source: "appointment" as const,
      title: a.title || `${a.type} appointment`,
      start,
      end: null,
      all_day,
      date: dayKey(start),
      event_type: "appointment" as const,
      child_id: a.child_id,
      child_name: input.resolveChild(a.child_id),
      staff_id: null,
      staff_name: null,
      location: a.location || null,
      status: a.status,
      editable: false,
      href: "/appointments",
      source_id: a.id,
    };
  });
}

function projectSupervisions(rows: SupervisionLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows
    .filter((s) => s.status === "scheduled" || s.status === "rescheduled")
    .map((s) => {
      const { start, all_day } = composeStart(s.scheduled_date);
      const staff = input.resolveStaff(s.staff_id);
      return {
        id: `sup_${s.id}`,
        source: "supervision" as const,
        title: `Supervision${staff ? ` — ${staff}` : ""}`,
        start,
        end: null,
        all_day,
        date: dayKey(start),
        event_type: "meeting" as const,
        child_id: null,
        child_name: null,
        staff_id: s.staff_id,
        staff_name: staff,
        location: null,
        status: s.status,
        editable: false,
        href: "/supervisions",
        source_id: s.id,
      };
    });
}

function projectLacReviews(rows: LacReviewLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows.map((r) => {
    const { start, all_day } = composeStart(r.date);
    const child = input.resolveChild(r.child_id);
    return {
      id: `lac_${r.id}`,
      source: "lac_review" as const,
      title: `LAC review${child ? ` — ${child}` : ""}`,
      start,
      end: null,
      all_day,
      date: dayKey(start),
      event_type: "review" as const,
      child_id: r.child_id,
      child_name: child,
      staff_id: null,
      staff_name: null,
      location: r.venue || null,
      status: null,
      editable: false,
      href: "/lac-reviews",
      source_id: r.id,
    };
  });
}

function projectFamilyTime(rows: FamilyTimeLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows.map((f) => {
    const { start, all_day } = composeStart(f.date, f.time);
    const child = input.resolveChild(f.child_id);
    return {
      id: `fam_${f.id}`,
      source: "family_time" as const,
      title: `Family time${child ? ` — ${child}` : ""}`,
      start,
      end: null,
      all_day,
      date: dayKey(start),
      event_type: "meeting" as const,
      child_id: f.child_id,
      child_name: child,
      staff_id: null,
      staff_name: null,
      location: f.location || null,
      status: null,
      editable: false,
      href: "/family-time-supervision",
      source_id: f.id,
    };
  });
}

function projectInterviews(rows: InterviewLike[]): CalendarItem[] {
  return rows
    .filter((i) => i.scheduled_at)
    .map((i) => ({
      id: `int_${i.id}`,
      source: "interview" as const,
      title: `Candidate interview (${i.interview_type})`,
      start: i.scheduled_at,
      end: null,
      all_day: !i.scheduled_at.includes("T"),
      date: dayKey(i.scheduled_at),
      event_type: "meeting" as const,
      child_id: null,
      child_name: null,
      staff_id: null,
      staff_name: null,
      location: i.location,
      status: null,
      editable: false,
      href: "/recruitment",
      source_id: i.id,
    }));
}

function projectTraining(rows: TrainingLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows
    .filter((t) => t.expiry_date)
    .map((t) => {
      const { start, all_day } = composeStart(t.expiry_date as string);
      const staff = input.resolveStaff(t.staff_id);
      return {
        id: `trn_${t.id}`,
        source: "training" as const,
        title: `Training expires: ${t.course_name}${staff ? ` (${staff})` : ""}`,
        start,
        end: null,
        all_day,
        date: dayKey(start),
        event_type: "deadline" as const,
        child_id: null,
        child_name: null,
        staff_id: t.staff_id,
        staff_name: staff,
        location: null,
        status: t.status,
        editable: false,
        href: "/training",
        source_id: t.id,
      };
    });
}

function projectKeyWorking(rows: KeyWorkingLike[], input: CalendarProjectionInput): CalendarItem[] {
  return rows.map((k) => {
    const { start, all_day } = composeStart(k.date);
    const child = input.resolveChild(k.child_id);
    return {
      id: `kw_${k.id}`,
      source: "key_working" as const,
      title: `Key-working${child ? ` — ${child}` : ""}`,
      start,
      end: null,
      all_day,
      date: dayKey(start),
      event_type: "meeting" as const,
      child_id: k.child_id,
      child_name: child,
      staff_id: k.staff_id,
      staff_name: input.resolveStaff(k.staff_id),
      location: null,
      status: null,
      editable: false,
      href: "/child-keyworker-1to1-sessions",
      source_id: k.id,
    };
  });
}

function projectShifts(rows: ShiftLike[], input: CalendarProjectionInput): CalendarItem[] {
  const dead = new Set(["cancelled", "no_show"]);
  return rows
    .filter((s) => !dead.has(s.status))
    .map((s) => {
      const { start, all_day } = composeStart(s.date, s.start_time);
      const staff = input.resolveStaff(s.staff_id);
      return {
        id: `shift_${s.id}`,
        source: "shift" as const,
        title: `${s.shift_type} shift${staff ? ` — ${staff}` : ""}`,
        start,
        end: endFromTimes(s.date, s.end_time),
        all_day,
        date: dayKey(start),
        event_type: "other" as const,
        child_id: null,
        child_name: null,
        staff_id: s.staff_id,
        staff_name: staff,
        location: null,
        status: s.status,
        editable: false,
        href: "/rota",
        source_id: s.id,
      };
    });
}

// ── Feed assembly ──────────────────────────────────────────────────────────────

function projectCircles(rows: CircleLike[]): CalendarItem[] {
  return rows.map((c) => ({
    id: `circle_${c.id}_${c.start.slice(0, 10)}`,
    source: "circle" as const,
    title: c.label,
    start: c.start,
    end: null,
    all_day: false,
    date: dayKey(c.start),
    event_type: "meeting" as const,
    child_id: null,
    child_name: null,
    staff_id: null,
    staff_name: null,
    location: null,
    // Deliberately no status: a circle is never "overdue" or "missed".
    status: null,
    editable: false,
    href: "/intelligence/cara/relational-rhythm",
    source_id: c.id,
  }));
}

const PROJECTORS: Record<CalendarSource, (input: CalendarProjectionInput) => CalendarItem[]> = {
  calendar: (i) => projectEvents(i.events, i),
  task: (i) => projectTasks(i.tasks, i),
  appointment: (i) => projectAppointments(i.appointments, i),
  supervision: (i) => projectSupervisions(i.supervisions, i),
  lac_review: (i) => projectLacReviews(i.lacReviews, i),
  family_time: (i) => projectFamilyTime(i.familyTime, i),
  interview: (i) => projectInterviews(i.interviews),
  training: (i) => projectTraining(i.training, i),
  key_working: (i) => projectKeyWorking(i.keyWorking, i),
  shift: (i) => projectShifts(i.shifts, i),
  circle: (i) => projectCircles(i.circles),
};

export function buildCalendarFeed(input: CalendarProjectionInput): CalendarFeed {
  const sources = input.sources && input.sources.length > 0 ? input.sources : ALL_CALENDAR_SOURCES;

  let items: CalendarItem[] = [];
  for (const source of sources) {
    const projector = PROJECTORS[source];
    if (projector) items.push(...projector(input));
  }

  items = items.filter((it) => inRange(it.date, input.range));
  // Chronological; ties broken by all-day-first then title for stable output.
  items.sort((a, b) => {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    if (a.all_day !== b.all_day) return a.all_day ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  const countMap = new Map<CalendarSource, number>();
  for (const it of items) countMap.set(it.source, (countMap.get(it.source) ?? 0) + 1);

  return {
    items,
    range: input.range ?? { from: "", to: "" },
    counts_by_source: ALL_CALENDAR_SOURCES.filter((s) => countMap.has(s)).map((s) => ({
      source: s,
      count: countMap.get(s) as number,
    })),
    sources_included: sources,
  };
}

// ── Reminders (pure) ───────────────────────────────────────────────────────────

export interface DueReminder {
  event: CalendarEvent;
  fire_at: string;
  /** ISO start of the specific occurrence being reminded. */
  occurrence: string;
  /** YYYY-MM-DD of that occurrence (the recurring dedupe key). */
  occurrence_day: string;
}

/**
 * Which planned events are inside their reminder window at `now` and haven't
 * fired yet. Pure — the route turns these into notifications and records that
 * the reminder fired. (No wall clock here; `now` is injected.)
 *
 * One-offs dedupe on `reminder_sent`; recurring events dedupe on
 * `last_reminded_occurrence` so each occurrence reminds exactly once.
 */
export function dueReminders(events: CalendarEvent[], now: string): DueReminder[] {
  const nowMs = Date.parse(now);
  const out: DueReminder[] = [];
  for (const e of events) {
    if (e.status !== "scheduled") continue;
    if (e.reminder_minutes_before == null) continue;
    const recurrence = e.recurrence ?? null;

    if (recurrence) {
      const occ = nextOccurrenceStart(e.start, recurrence, now);
      if (!occ) continue;
      const occDay = occ.slice(0, 10);
      if (e.last_reminded_occurrence === occDay) continue;
      const startMs = Date.parse(occ);
      const fireMs = startMs - e.reminder_minutes_before * 60_000;
      if (nowMs >= fireMs && nowMs <= startMs) {
        out.push({ event: e, fire_at: new Date(fireMs).toISOString(), occurrence: occ, occurrence_day: occDay });
      }
      continue;
    }

    if (e.reminder_sent) continue;
    const startMs = Date.parse(e.start);
    if (!Number.isFinite(startMs)) continue;
    const fireMs = startMs - e.reminder_minutes_before * 60_000;
    // Fire once we're inside the window but the meeting hasn't started.
    if (nowMs >= fireMs && nowMs <= startMs) {
      out.push({ event: e, fire_at: new Date(fireMs).toISOString(), occurrence: e.start, occurrence_day: e.start.slice(0, 10) });
    }
  }
  return out;
}

/** Staff attendees (+ organiser) to notify for an event, de-duplicated. */
export function notifiableStaffIds(event: CalendarEvent): string[] {
  const ids = new Set<string>();
  if (event.organiser_id) ids.add(event.organiser_id);
  for (const a of event.attendees) {
    if (a.kind === "staff" && a.staff_id) ids.add(a.staff_id);
  }
  return [...ids];
}

export function summariseAttendees(attendees: CalendarAttendee[]): {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
} {
  return {
    total: attendees.length,
    accepted: attendees.filter((a) => a.response === "accepted").length,
    declined: attendees.filter((a) => a.response === "declined").length,
    pending: attendees.filter((a) => a.response === "pending" || a.response === "tentative").length,
  };
}
