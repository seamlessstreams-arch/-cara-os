// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR — a live tenant's events must be READ, not just written
//
// THE INCIDENT (19 Sep 2026): Oak House had 3 rows in calendar_events and a
// blank calendar. Events had written through to Supabase since migration 416,
// but nothing ever read them back — every calendar surface, and the reminder
// sweep behind /api/cron, read getStore().calendarEvents, which isLiveTenant()
// empties at start-up. Found while checking whether the cron was worth
// enabling: it wasn't, because runDueReminders swept an array that is always
// empty on a live tenant.
//
// The live-fiction crawl could not catch this: a silently EMPTY page is neither
// fiction nor a crash. These pin the read path instead.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";

const rows = vi.hoisted(() => ({ current: [] as Record<string, unknown>[] }));

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => true,
  createServerClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: rows.current, error: null }) }) }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
}));

import { getCalendarEvents } from "@/lib/supabase/calendar-persist";

const row = (over: Record<string, unknown> = {}) => ({
  id: "cal_1", home_id: "h1", title: "LAC review", description: null,
  event_type: "meeting", starts_at: "2026-09-20T10:00:00", ends_at: null,
  all_day: false, location: "Oak House", child_id: "yp_1", organiser_id: "staff_1",
  attendees: [], linked_task_ids: [], reminder_minutes_before: 60,
  reminder_sent: false, invite_sent: false, recurrence: null,
  last_reminded_occurrence: null, status: "scheduled",
  created_at: "2026-09-01T09:00:00Z", updated_at: "2026-09-01T09:00:00Z", ...over,
});

beforeEach(() => { rows.current = []; });

describe("getCalendarEvents — the read path that did not exist", () => {
  it("returns the home's stored events", async () => {
    rows.current = [row(), row({ id: "cal_2", title: "Supervision" })];
    const events = await getCalendarEvents();
    expect(events.map((e) => e.id)).toEqual(["cal_1", "cal_2"]);
  });

  it("maps the row shape onto the app's CalendarEvent", async () => {
    rows.current = [row()];
    const [e] = await getCalendarEvents();
    expect(e.start).toBe("2026-09-20T10:00:00"); // starts_at → start
    expect(e.end).toBeNull();                     // ends_at → end
    expect(e.title).toBe("LAC review");
    expect(e.description).toBe("");               // null → "" (the app's type)
    expect(Array.isArray(e.attendees)).toBe(true);
    expect(Array.isArray(e.linked_task_ids)).toBe(true);
  });

  it("carries the recurrence fields the reminder sweep dedupes on", async () => {
    rows.current = [row({ recurrence: { freq: "weekly", interval: 1 }, last_reminded_occurrence: "2026-09-13" })];
    const [e] = await getCalendarEvents();
    expect(e.recurrence).toEqual({ freq: "weekly", interval: 1 });
    expect(e.last_reminded_occurrence).toBe("2026-09-13");
  });

  it("an empty table is an empty calendar, not an error", async () => {
    expect(await getCalendarEvents()).toEqual([]);
  });
});
