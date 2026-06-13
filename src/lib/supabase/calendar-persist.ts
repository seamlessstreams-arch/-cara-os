// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR write-through helper
//
// Same contract as the other persist modules: best-effort, never throws, no-op
// in demo mode. Events upsert by their application TEXT id (cal_…) so the
// create → edit → reschedule → cancel lifecycle lands on one row (migration 416).
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";
import type { CalendarEvent } from "@/lib/calendar/calendar-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { from(table: string): any };
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
