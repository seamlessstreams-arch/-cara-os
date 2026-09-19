// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR write-through helper
//
// Same contract as the other persist modules: best-effort, never throws, no-op
// in demo mode. Events upsert by their application TEXT id (cal_…) so the
// create → edit → reschedule → cancel lifecycle lands on one row (migration 416).
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";
import type { CalendarEvent } from "@/lib/calendar/calendar-types";

import type { RawClient } from "@/lib/supabase/loose-client";
function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Upsert the calendar event row by its application id. */
export async function persistCalendarEvent(e: CalendarEvent): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("calendar_events").upsert(
      {
        id: e.id,
        home_id: homeId(),
        title: e.title,
        description: e.description,
        event_type: e.event_type,
        starts_at: e.start,
        ends_at: e.end,
        all_day: e.all_day,
        location: e.location,
        child_id: e.child_id,
        organiser_id: e.organiser_id,
        attendees: e.attendees,
        linked_task_ids: e.linked_task_ids,
        reminder_minutes_before: e.reminder_minutes_before,
        reminder_sent: e.reminder_sent,
        invite_sent: e.invite_sent,
        recurrence: e.recurrence ?? null,
        last_reminded_occurrence: e.last_reminded_occurrence ?? null,
        status: e.status,
        updated_at: e.updated_at,
      },
      { onConflict: "id" },
    );
  } catch {
    // best-effort
  }
}

// ── Read back ────────────────────────────────────────────────────────────────
// The missing half of this module. Events have written through to Supabase
// since migration 416, but nothing ever read them BACK: every calendar surface
// (and the reminder sweep) read the in-memory store, which is emptied on a live
// tenant. Oak House had 3 real events in the table and a blank calendar.
//
// Returns [] rather than throwing — the calendar degrades to its other sources
// rather than erroring the page. Rows map back to the app's CalendarEvent
// shape: starts_at/ends_at → start/end, and the jsonb columns are already the
// right shapes.

interface CalendarEventRow {
  id: string; home_id: string; title: string; description: string | null;
  event_type: string; starts_at: string; ends_at: string | null; all_day: boolean;
  location: string | null; child_id: string | null; organiser_id: string | null;
  attendees: unknown; linked_task_ids: unknown;
  reminder_minutes_before: number | null; reminder_sent: boolean; invite_sent: boolean;
  recurrence: unknown; last_reminded_occurrence: string | null;
  status: string; created_at: string; updated_at: string;
}

function toEvent(r: CalendarEventRow): CalendarEvent {
  return {
    id: r.id,
    home_id: r.home_id,
    title: r.title,
    description: r.description ?? "",
    event_type: r.event_type as CalendarEvent["event_type"],
    start: r.starts_at,
    end: r.ends_at,
    all_day: r.all_day,
    location: r.location,
    child_id: r.child_id,
    organiser_id: r.organiser_id ?? "",
    attendees: (Array.isArray(r.attendees) ? r.attendees : []) as CalendarEvent["attendees"],
    linked_task_ids: (Array.isArray(r.linked_task_ids) ? r.linked_task_ids : []) as string[],
    reminder_minutes_before: r.reminder_minutes_before,
    reminder_sent: r.reminder_sent,
    invite_sent: r.invite_sent,
    recurrence: (r.recurrence ?? null) as CalendarEvent["recurrence"],
    last_reminded_occurrence: r.last_reminded_occurrence,
    status: r.status as CalendarEvent["status"],
    created_at: r.created_at,
    updated_at: r.updated_at,
    // Not a column on calendar_events; the organiser is the closest honest
    // answer, and no surface distinguishes them.
    created_by: r.organiser_id ?? "",
  };
}

/** Every calendar event for this home. [] when Supabase is off or the read fails. */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];
  try {
    const { data, error } = await raw(c)
      .from("calendar_events")
      .select("*")
      .eq("home_id", homeId())
      .order("starts_at", { ascending: true });
    if (error) return [];
    return ((data ?? []) as CalendarEventRow[]).map(toEvent);
  } catch {
    return [];
  }
}
