import "server-only";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR service (route-facing)
//
// Wires the pure projection engine to the live store: resolves names, fans the
// store's dated collections into the feed, and owns the write path for the one
// editable collection (create/update/cancel/RSVP). Reminders and invite
// notifications go through the EXISTING notification system — never a new one.
//
// Boundary: nothing here sends external email. "Send invite" produces an .ics
// for download + a mailto the user sends themselves, and notifies internal
// staff in-app. Reminders create in-app notifications only.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { getStore, db } from "@/lib/db/store";
import { createTaskRecord } from "@/lib/supabase/care-records";
import type { CalendarEvent, CalendarAttendee, CalendarSource } from "./calendar-types";
import {
  buildCalendarFeed,
  dueReminders,
  notifiableStaffIds,
  type CalendarProjectionInput,
} from "./calendar-engine";
import { persistCalendarEvent } from "@/lib/supabase/calendar-persist";

import { expandOccurrences } from "@/lib/calendar/recurrence";
import { circleDefinition } from "@/lib/relational-rhythm/rhythm-engine";

/** Circles are a rhythm, not a dated record: with no explicit range, show the
 *  coming fortnight rather than expanding a daily circle to the hard cap. */
function defaultCircleWindow(): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(now), to: iso(new Date(now.getTime() + 14 * 86_400_000)) };
}


const HOME_ID = "home_oak";

// ── Name resolvers from the LIVE store (stays correct as the store grows) ──────

function makeResolvers(): Pick<CalendarProjectionInput, "resolveChild" | "resolveStaff"> {
  const store = getStore();
  return {
    resolveChild: (id) => {
      if (!id) return null;
      const yp = store.youngPeople.find((y) => y.id === id);
      return yp ? yp.preferred_name || yp.first_name || "Unknown" : null;
    },
    resolveStaff: (id) => {
      if (!id) return null;
      const s = store.staff.find((m) => m.id === id);
      return s ? s.full_name || `${s.first_name} ${s.last_name}`.trim() : null;
    },
  };
}

// ── Feed ───────────────────────────────────────────────────────────────────────

export function getCalendarFeed(opts: {
  from?: string;
  to?: string;
  sources?: CalendarSource[];
}) {
  const store = getStore();
  const resolvers = makeResolvers();
  const range = opts.from && opts.to ? { from: opts.from, to: opts.to } : undefined;

  return buildCalendarFeed({
    events: store.calendarEvents,
    tasks: store.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      status: t.status,
      linked_child_id: t.linked_child_id,
      assigned_to: t.assigned_to,
    })),
    appointments: store.appointments.map((a) => ({
      id: a.id,
      child_id: a.child_id,
      date: a.date,
      time: a.time,
      type: a.type,
      title: a.title,
      location: a.location,
      status: a.status,
    })),
    supervisions: store.supervisions.map((s) => ({
      id: s.id,
      staff_id: s.staff_id,
      scheduled_date: s.scheduled_date,
      type: s.type,
      status: s.status,
    })),
    lacReviews: store.lacReviews.map((r) => ({
      id: r.id,
      child_id: r.child_id,
      date: r.date,
      review_type: r.review_type,
      venue: r.venue,
    })),
    familyTime: store.familyTimeSessions.map((f) => ({
      id: f.id,
      child_id: f.child_id,
      date: f.date,
      time: f.time,
      location: f.location,
    })),
    interviews: store.candidateInterviews.map((i) => ({
      id: i.id,
      scheduled_at: i.scheduled_at,
      interview_type: i.interview_type,
      location: i.location,
    })),
    training: store.trainingRecords.map((t) => ({
      id: t.id,
      staff_id: t.staff_id,
      course_name: t.course_name,
      expiry_date: t.expiry_date,
      status: t.status,
    })),
    keyWorking: store.keyWorkingSessions.map((k) => ({
      id: k.id,
      child_id: k.child_id,
      staff_id: k.staff_id,
      date: k.date,
      type: k.type,
    })),
    shifts: store.shifts.map((s) => ({
      id: s.id,
      staff_id: s.staff_id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      shift_type: s.shift_type,
      status: s.status,
    })),
    // Relational circles (doctrine 2.1.3). Expanded through the SAME recurrence
    // maths as everything else — one scheduler, not two. Only enabled rhythms
    // appear: a circle a home has switched off should vanish, not nag.
    circles: (store.circleRhythms ?? [])
      .filter((r) => r.enabled)
      .flatMap((r) =>
        expandOccurrences(r.starts_at, r.recurrence, range ?? defaultCircleWindow(), 120).map((start) => ({
          id: r.id,
          kind: r.kind,
          label: circleDefinition(r.kind).label,
          purpose: circleDefinition(r.kind).purpose,
          start,
        })),
      ),
    ...resolvers,
    range,
    sources: opts.sources,
  });
}

// ── Validation ─────────────────────────────────────────────────────────────────

const AttendeeSchema = z.object({
  kind: z.enum(["staff", "external"]),
  name: z.string().trim().min(1),
  email: z.string().trim().email().nullable().optional(),
  staff_id: z.string().nullable().optional(),
});

const RecurrenceSchema = z
  .object({
    freq: z.enum(["daily", "weekly", "fortnightly", "monthly"]),
    interval: z.number().int().min(1).max(52).default(1),
    until: z.string().nullable().default(null),
    count: z.number().int().min(1).max(365).nullable().default(null),
  })
  .nullable()
  .optional();

export const CreateEventSchema = z.object({
  title: z.string().trim().min(2, "A title is required."),
  description: z.string().trim().optional().default(""),
  event_type: z.enum(["meeting", "appointment", "review", "training", "visit", "deadline", "other"]).default("meeting"),
  start: z.string().min(10, "A start date/time is required."),
  end: z.string().nullable().optional(),
  all_day: z.boolean().default(false),
  location: z.string().trim().nullable().optional(),
  child_id: z.string().nullable().optional(),
  organiser_id: z.string().default("staff_darren"),
  attendees: z.array(AttendeeSchema).default([]),
  reminder_minutes_before: z.number().int().min(0).max(10080).nullable().optional(),
  recurrence: RecurrenceSchema,
  /** When provided, a linked task is created for each (capture-once: the task lives in store.tasks). */
  tasks: z.array(z.object({ title: z.string().trim().min(2), due_date: z.string().nullable().optional() })).default([]),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  event_type: z.enum(["meeting", "appointment", "review", "training", "visit", "deadline", "other"]).optional(),
  start: z.string().optional(),
  end: z.string().nullable().optional(),
  all_day: z.boolean().optional(),
  location: z.string().trim().nullable().optional(),
  child_id: z.string().nullable().optional(),
  reminder_minutes_before: z.number().int().min(0).max(10080).nullable().optional(),
  recurrence: RecurrenceSchema,
  status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
});

// ── Notifications (existing system) ────────────────────────────────────────────

function notifyStaff(event: CalendarEvent, title: string, body: string): number {
  const ids = notifiableStaffIds(event);
  for (const recipientId of ids) {
    db.notifications.create({
      home_id: HOME_ID,
      recipient_id: recipientId,
      title,
      body,
      action_url: `/calendar?event=${event.id}`,
      type: "task",
      priority: "normal",
      read: false,
      read_at: null,
      entity_type: "calendar_event",
      entity_id: event.id,
    });
  }
  return ids.length;
}

// ── Write path ─────────────────────────────────────────────────────────────────

export function createCalendarEvent(input: CreateEventInput): CalendarEvent {
  // Capture-once: linked tasks are REAL tasks in store.tasks, not copies.
  const linkedTaskIds: string[] = [];
  for (const t of input.tasks) {
    const task = createTaskRecord({
      title: t.title,
      description: `Linked to meeting: ${input.title}`,
      category: "admin",
      priority: "medium",
      status: "not_started",
      due_date: t.due_date ?? input.start.slice(0, 10),
      assigned_to: input.organiser_id,
      linked_child_id: input.child_id ?? null,
      home_id: HOME_ID,
      created_by: input.organiser_id,
      updated_by: input.organiser_id,
    });
    if (task?.id) linkedTaskIds.push(task.id);
  }

  const attendees: CalendarAttendee[] = input.attendees.map((a, i) => ({
    id: `att_${i + 1}`,
    kind: a.kind,
    name: a.name,
    email: a.email ?? null,
    staff_id: a.staff_id ?? null,
    response: "pending",
  }));

  const event = db.calendarEvents.create({
    title: input.title,
    description: input.description ?? "",
    event_type: input.event_type,
    start: input.start,
    end: input.end ?? null,
    all_day: input.all_day,
    location: input.location ?? null,
    child_id: input.child_id ?? null,
    organiser_id: input.organiser_id,
    attendees,
    linked_task_ids: linkedTaskIds,
    reminder_minutes_before: input.reminder_minutes_before ?? null,
    recurrence: input.recurrence
      ? {
          freq: input.recurrence.freq,
          interval: input.recurrence.interval,
          until: input.recurrence.until,
          count: input.recurrence.count,
        }
      : null,
  });

  void persistCalendarEvent(event);
  notifyStaff(event, "Added to a meeting", `${event.title} — ${event.start.replace("T", " ").slice(0, 16)}`);
  return event;
}

export function updateCalendarEvent(id: string, patch: z.infer<typeof UpdateEventSchema>): CalendarEvent | null {
  const before = db.calendarEvents.findById(id);
  if (!before) return null;
  const updated = db.calendarEvents.update(id, patch);
  if (!updated) return null;
  void persistCalendarEvent(updated);
  // Reschedule/cancel are worth telling attendees about.
  if (patch.start && patch.start !== before.start) {
    notifyStaff(updated, "Meeting rescheduled", `${updated.title} → ${updated.start.replace("T", " ").slice(0, 16)}`);
  }
  if (patch.status === "cancelled" && before.status !== "cancelled") {
    notifyStaff(updated, "Meeting cancelled", updated.title);
  }
  return updated;
}

export function setAttendeeResponse(
  id: string,
  attendeeId: string,
  response: CalendarAttendee["response"],
): CalendarEvent | null {
  const event = db.calendarEvents.findById(id);
  if (!event) return null;
  const attendees = event.attendees.map((a) => (a.id === attendeeId ? { ...a, response } : a));
  const updated = db.calendarEvents.update(id, { attendees });
  if (updated) void persistCalendarEvent(updated);
  return updated;
}

/** Mark an invite as sent and notify internal staff. Returns count notified. */
export function markInviteSent(id: string): { event: CalendarEvent; notified: number } | null {
  const event = db.calendarEvents.findById(id);
  if (!event) return null;
  const updated = db.calendarEvents.update(id, { invite_sent: true });
  if (!updated) return null;
  void persistCalendarEvent(updated);
  const notified = notifyStaff(updated, "Meeting invite", `Invite sent for: ${updated.title}`);
  return { event: updated, notified };
}

/** Idempotent: fire in-app reminders for events inside their window. */
export function runDueReminders(now: string): { fired: number } {
  const store = getStore();
  const due = dueReminders(store.calendarEvents, now);
  for (const { event, occurrence, occurrence_day } of due) {
    notifyStaff(event, "Meeting reminder", `${event.title} starts at ${occurrence.replace("T", " ").slice(0, 16)}`);
    // Recurring events dedupe per occurrence; one-offs flip reminder_sent.
    const patch = event.recurrence
      ? { last_reminded_occurrence: occurrence_day }
      : { reminder_sent: true };
    const updated = db.calendarEvents.update(event.id, patch);
    if (updated) void persistCalendarEvent(updated);
  }
  return { fired: due.length };
}
