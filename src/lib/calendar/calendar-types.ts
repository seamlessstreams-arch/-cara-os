// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR types
//
// One NEW write surface (`CalendarEvent`) for meetings/appointments that don't
// already live in another module, plus a read-only PROJECTION (`CalendarItem`)
// over everything in the store that already carries a date. Core rule: capture
// once, surface everywhere, never duplicate — projected items are never copied
// into the calendar collection; the calendar reads them live and links back to
// their source module for editing.
//
// Pure types only — safe to import anywhere (store, hooks, UI, engine).
// ══════════════════════════════════════════════════════════════════════════════

import type { CalendarRecurrence } from "./recurrence";
export type { CalendarRecurrence, RecurrenceFreq } from "./recurrence";

export type CalendarEventType =
  | "meeting"
  | "appointment"
  | "review"
  | "training"
  | "visit"
  | "deadline"
  | "other";

export type AttendeeResponse = "pending" | "accepted" | "declined" | "tentative";

export interface CalendarAttendee {
  id: string;
  /** Internal staff member, or an external professional/family contact. */
  kind: "staff" | "external";
  name: string;
  email: string | null;
  /** Set when kind === "staff" so we can notify them in-app. */
  staff_id: string | null;
  response: AttendeeResponse;
}

/** A planned meeting/appointment — the calendar's own editable record. */
export interface CalendarEvent {
  id: string;
  home_id: string;
  title: string;
  description: string;
  event_type: CalendarEventType;
  /** ISO datetime (naive local, e.g. 2026-06-20T14:30:00). */
  start: string;
  /** ISO datetime; null for all-day or open-ended. */
  end: string | null;
  all_day: boolean;
  location: string | null;
  /** Linked young person, when the meeting is about a child. */
  child_id: string | null;
  /** Staff id of the organiser. */
  organiser_id: string;
  attendees: CalendarAttendee[];
  /** Associated tasks (ids in store.tasks) created/linked for this meeting. */
  linked_task_ids: string[];
  reminder_minutes_before: number | null;
  reminder_sent: boolean;
  invite_sent: boolean;
  /** Repeat rule; null for a one-off event. */
  recurrence?: CalendarRecurrence | null;
  /** YYYY-MM-DD of the last occurrence we sent a reminder for (recurring dedupe). */
  last_reminded_occurrence?: string | null;
  status: "scheduled" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
  created_by: string;
}

/** Where a unified calendar item came from. "calendar" = the editable collection. */
export type CalendarSource =
  | "calendar"
  | "task"
  | "appointment"
  | "supervision"
  | "lac_review"
  | "family_time"
  | "interview"
  | "training"
  | "key_working"
  | "shift";

/** A single row on the unified calendar feed (planned event OR projection). */
export interface CalendarItem {
  /** Source-prefixed id so projected and planned items never collide. */
  id: string;
  source: CalendarSource;
  title: string;
  /** ISO datetime (naive local). */
  start: string;
  end: string | null;
  all_day: boolean;
  /** YYYY-MM-DD derived from start — the grid bucket key. */
  date: string;
  event_type: CalendarEventType | null;
  child_id: string | null;
  child_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  location: string | null;
  status: string | null;
  /** Only true for source === "calendar"; projections edit at their source. */
  editable: boolean;
  /** Deep-link to the editor (calendar) or the source module. */
  href: string;
  /** Original record id (un-prefixed) for the source module. */
  source_id: string;
  /** True when this item is one occurrence of a recurring planned event. */
  recurring?: boolean;
}

export interface CalendarFeed {
  items: CalendarItem[];
  range: { from: string; to: string };
  counts_by_source: { source: CalendarSource; count: number }[];
  sources_included: CalendarSource[];
}

export const ALL_CALENDAR_SOURCES: CalendarSource[] = [
  "calendar",
  "task",
  "appointment",
  "supervision",
  "lac_review",
  "family_time",
  "interview",
  "training",
  "key_working",
  "shift",
];

/** Human labels for the source filter chips. */
export const CALENDAR_SOURCE_LABELS: Record<CalendarSource, string> = {
  calendar: "Meetings & events",
  task: "Task deadlines",
  appointment: "Appointments",
  supervision: "Supervisions",
  lac_review: "LAC reviews",
  family_time: "Family time",
  interview: "Interviews",
  training: "Training expiry",
  key_working: "Key-working",
  shift: "Shifts",
};
