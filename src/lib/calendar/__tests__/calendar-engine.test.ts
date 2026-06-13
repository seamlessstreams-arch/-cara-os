import { describe, expect, it } from "vitest";
import {
  buildCalendarFeed,
  composeStart,
  dueReminders,
  notifiableStaffIds,
  summariseAttendees,
  type CalendarProjectionInput,
} from "../calendar-engine";
import type { CalendarEvent } from "../calendar-types";

function baseEvent(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    home_id: "home_oak",
    title: "Placement planning meeting",
    description: "",
    event_type: "meeting",
    start: "2026-06-20T14:00:00",
    end: "2026-06-20T15:00:00",
    all_day: false,
    location: "Office",
    child_id: "yp-001",
    organiser_id: "staff-001",
    attendees: [],
    linked_task_ids: [],
    reminder_minutes_before: null,
    reminder_sent: false,
    invite_sent: false,
    status: "scheduled",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    created_by: "staff-001",
    ...over,
  };
}

function emptyInput(over: Partial<CalendarProjectionInput> = {}): CalendarProjectionInput {
  return {
    events: [],
    tasks: [],
    appointments: [],
    supervisions: [],
    lacReviews: [],
    familyTime: [],
    interviews: [],
    training: [],
    keyWorking: [],
    shifts: [],
    resolveChild: (id) => (id ? `Child ${id}` : null),
    resolveStaff: (id) => (id ? `Staff ${id}` : null),
    ...over,
  };
}

describe("composeStart", () => {
  it("composes a timed start from date + HH:MM", () => {
    expect(composeStart("2026-06-20", "14:30")).toEqual({ start: "2026-06-20T14:30:00", all_day: false });
  });
  it("falls back to all-day when time is missing or malformed", () => {
    expect(composeStart("2026-06-20")).toEqual({ start: "2026-06-20T00:00:00", all_day: true });
    expect(composeStart("2026-06-20", "nonsense")).toEqual({ start: "2026-06-20T00:00:00", all_day: true });
    expect(composeStart("2026-06-20", "25:99")).toEqual({ start: "2026-06-20T00:00:00", all_day: true });
  });
});

describe("buildCalendarFeed — planned events", () => {
  it("projects a calendar event as editable with an editor href", () => {
    const feed = buildCalendarFeed(emptyInput({ events: [baseEvent()] }));
    expect(feed.items).toHaveLength(1);
    const it = feed.items[0];
    expect(it.source).toBe("calendar");
    expect(it.editable).toBe(true);
    expect(it.href).toBe("/calendar?event=e1");
    expect(it.child_name).toBe("Child yp-001");
    expect(it.staff_name).toBe("Staff staff-001");
    expect(it.id).toBe("cal_e1");
  });

  it("hides cancelled events", () => {
    const feed = buildCalendarFeed(emptyInput({ events: [baseEvent({ status: "cancelled" })] }));
    expect(feed.items).toHaveLength(0);
  });
});

describe("buildCalendarFeed — projections never duplicate, always read-only", () => {
  it("projects task deadlines (open only) as non-editable", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        tasks: [
          { id: "t1", title: "Update care plan", due_date: "2026-06-21", status: "pending", linked_child_id: "yp-001", assigned_to: "staff-002" },
          { id: "t2", title: "Done thing", due_date: "2026-06-21", status: "completed", linked_child_id: null, assigned_to: null },
          { id: "t3", title: "No date", due_date: null, status: "pending", linked_child_id: null, assigned_to: null },
        ],
      }),
    );
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].source).toBe("task");
    expect(feed.items[0].editable).toBe(false);
    expect(feed.items[0].all_day).toBe(true);
    expect(feed.items[0].title).toBe("Due: Update care plan");
    expect(feed.items[0].href).toBe("/tasks");
  });

  it("projects appointments with composed time", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        appointments: [
          { id: "a1", child_id: "yp-002", date: "2026-06-22", time: "09:15", type: "dental", title: "Dentist", location: "Clinic", status: "scheduled" },
        ],
      }),
    );
    expect(feed.items[0].start).toBe("2026-06-22T09:15:00");
    expect(feed.items[0].child_name).toBe("Child yp-002");
    expect(feed.items[0].source).toBe("appointment");
  });

  it("projects only scheduled/rescheduled supervisions", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        supervisions: [
          { id: "s1", staff_id: "staff-003", scheduled_date: "2026-06-23", type: "formal", status: "scheduled" },
          { id: "s2", staff_id: "staff-003", scheduled_date: "2026-06-10", type: "formal", status: "completed" },
        ],
      }),
    );
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe("Supervision — Staff staff-003");
  });

  it("projects training EXPIRY as a deadline", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        training: [
          { id: "tr1", staff_id: "staff-001", course_name: "Safeguarding L2", expiry_date: "2026-07-01", status: "valid" },
          { id: "tr2", staff_id: "staff-001", course_name: "No expiry", expiry_date: null, status: "valid" },
        ],
      }),
    );
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].event_type).toBe("deadline");
    expect(feed.items[0].title).toContain("Training expires: Safeguarding L2");
  });

  it("projects interviews, lac reviews, family time, key-working and shifts", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        interviews: [{ id: "i1", scheduled_at: "2026-06-24T10:00:00", interview_type: "panel", location: "HQ" }],
        lacReviews: [{ id: "l1", child_id: "yp-001", date: "2026-06-25", review_type: "statutory", venue: "School" }],
        familyTime: [{ id: "f1", child_id: "yp-001", date: "2026-06-26", time: "16:00", location: "Contact centre" }],
        keyWorking: [{ id: "k1", child_id: "yp-002", staff_id: "staff-002", date: "2026-06-27", type: "one_to_one" }],
        shifts: [{ id: "sh1", staff_id: "staff-001", date: "2026-06-28", start_time: "08:00", end_time: "20:00", shift_type: "long_day", status: "scheduled" }],
      }),
    );
    const bySource = Object.fromEntries(feed.items.map((i) => [i.source, i]));
    expect(bySource.interview.start).toBe("2026-06-24T10:00:00");
    expect(bySource.lac_review.title).toBe("LAC review — Child yp-001");
    expect(bySource.family_time.start).toBe("2026-06-26T16:00:00");
    expect(bySource.key_working.title).toBe("Key-working — Child yp-002");
    expect(bySource.shift.end).toBe("2026-06-28T20:00:00");
  });

  it("drops cancelled/no-show shifts", () => {
    const feed = buildCalendarFeed(
      emptyInput({
        shifts: [
          { id: "sh1", staff_id: "s", date: "2026-06-28", start_time: "08:00", end_time: "16:00", shift_type: "day", status: "cancelled" },
          { id: "sh2", staff_id: "s", date: "2026-06-28", start_time: "08:00", end_time: "16:00", shift_type: "day", status: "no_show" },
        ],
      }),
    );
    expect(feed.items).toHaveLength(0);
  });
});

describe("buildCalendarFeed — range, sources, ordering", () => {
  const big = emptyInput({
    events: [baseEvent({ id: "e1", start: "2026-06-20T14:00:00" })],
    tasks: [{ id: "t1", title: "x", due_date: "2026-07-15", status: "pending", linked_child_id: null, assigned_to: null }],
    appointments: [{ id: "a1", child_id: "yp", date: "2026-06-19", time: "09:00", type: "gp", title: "GP", location: "", status: "scheduled" }],
  });

  it("filters to an inclusive YYYY-MM-DD range", () => {
    const feed = buildCalendarFeed({ ...big, range: { from: "2026-06-01", to: "2026-06-30" } });
    expect(feed.items.map((i) => i.source).sort()).toEqual(["appointment", "calendar"]);
  });

  it("filters by requested sources only", () => {
    const feed = buildCalendarFeed({ ...big, sources: ["calendar"] });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].source).toBe("calendar");
    expect(feed.sources_included).toEqual(["calendar"]);
  });

  it("sorts chronologically and reports counts by source", () => {
    const feed = buildCalendarFeed(big);
    expect(feed.items.map((i) => i.start)).toEqual([
      "2026-06-19T09:00:00",
      "2026-06-20T14:00:00",
      "2026-07-15T00:00:00",
    ]);
    expect(feed.counts_by_source).toEqual(
      expect.arrayContaining([
        { source: "calendar", count: 1 },
        { source: "task", count: 1 },
        { source: "appointment", count: 1 },
      ]),
    );
  });
});

describe("dueReminders", () => {
  it("fires inside the reminder window, once, for scheduled events only", () => {
    const e = baseEvent({ start: "2026-06-20T14:00:00", reminder_minutes_before: 60 });
    // 30 min before start → inside the 60-min window
    expect(dueReminders([e], "2026-06-20T13:30:00")).toHaveLength(1);
    // 2h before → too early
    expect(dueReminders([e], "2026-06-20T12:00:00")).toHaveLength(0);
    // after start → window closed
    expect(dueReminders([e], "2026-06-20T14:30:00")).toHaveLength(0);
  });

  it("skips already-sent, cancelled, or reminder-less events", () => {
    const sent = baseEvent({ reminder_minutes_before: 60, reminder_sent: true });
    const cancelled = baseEvent({ reminder_minutes_before: 60, status: "cancelled" });
    const none = baseEvent({ reminder_minutes_before: null });
    expect(dueReminders([sent, cancelled, none], "2026-06-20T13:30:00")).toHaveLength(0);
  });
});

describe("attendee helpers", () => {
  it("collects organiser + staff attendees, de-duplicated", () => {
    const e = baseEvent({
      organiser_id: "staff-001",
      attendees: [
        { id: "1", kind: "staff", name: "A", email: null, staff_id: "staff-002", response: "pending" },
        { id: "2", kind: "staff", name: "Dup", email: null, staff_id: "staff-001", response: "pending" },
        { id: "3", kind: "external", name: "Ext", email: "x@y.com", staff_id: null, response: "pending" },
      ],
    });
    expect(notifiableStaffIds(e).sort()).toEqual(["staff-001", "staff-002"]);
  });

  it("summarises responses", () => {
    const s = summariseAttendees([
      { id: "1", kind: "staff", name: "A", email: null, staff_id: "s1", response: "accepted" },
      { id: "2", kind: "staff", name: "B", email: null, staff_id: "s2", response: "declined" },
      { id: "3", kind: "external", name: "C", email: null, staff_id: null, response: "pending" },
      { id: "4", kind: "external", name: "D", email: null, staff_id: null, response: "tentative" },
    ]);
    expect(s).toEqual({ total: 4, accepted: 1, declined: 1, pending: 2 });
  });
});
