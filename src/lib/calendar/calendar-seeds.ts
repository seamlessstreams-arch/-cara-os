// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR demo seeds
//
// A small spread of planned meetings/appointments anchored to the seeded staff
// and young people, so the calendar shows its own editable events alongside the
// live projections in demo mode. Dates are RELATIVE to "now" at read time so the
// calendar always has near-future content regardless of when the demo is opened.
// ══════════════════════════════════════════════════════════════════════════════

import type { CalendarEvent } from "./calendar-types";

const DAY = 864e5;

function iso(daysFromNow: number, hhmm: string): string {
  const d = new Date(Date.now() + daysFromNow * DAY);
  const day = d.toISOString().slice(0, 10);
  return `${day}T${hhmm}:00`;
}

function plusMinutes(start: string, minutes: number): string {
  const m = start.match(/T(\d{2}):(\d{2})/);
  if (!m) return start;
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + minutes;
  const hh = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return start.replace(/T\d{2}:\d{2}/, `T${hh}:${mm}`);
}

export function seedCalendarEvents(): CalendarEvent[] {
  const now = new Date().toISOString();
  const make = (
    id: string,
    title: string,
    daysFromNow: number,
    hhmm: string,
    durationMin: number,
    over: Partial<CalendarEvent>,
  ): CalendarEvent => {
    const start = iso(daysFromNow, hhmm);
    return {
      id,
      home_id: "home_oak",
      title,
      description: "",
      event_type: "meeting",
      start,
      end: plusMinutes(start, durationMin),
      all_day: false,
      location: null,
      child_id: null,
      organiser_id: "staff_darren",
      attendees: [],
      linked_task_ids: [],
      reminder_minutes_before: 60,
      reminder_sent: false,
      invite_sent: false,
      recurrence: null,
      last_reminded_occurrence: null,
      status: "scheduled",
      created_at: now,
      updated_at: now,
      created_by: "staff_darren",
      ...over,
    };
  };

  return [
    // ── Today (relative to now) — gives the shift plan's running order and the
    // calendar real content for the current day, every day the demo is opened. ──
    make("cal_seed_keywork_today", "Key-working session — Alex", 0, "11:00", 45, {
      event_type: "meeting",
      location: "Quiet lounge",
      description: "Planned 1:1 key-working session. Check in on goals and how Alex is feeling.",
      child_id: "yp_alex",
    }),
    make("cal_seed_appt_today", "CAMHS appointment — Jordan", 0, "14:30", 60, {
      event_type: "appointment",
      location: "CAMHS clinic",
      description: "Routine CAMHS review. Staff to support transport and attend.",
      child_id: "yp_jordan",
    }),
    make("cal_seed_contact_today", "Family time — Casey", 0, "16:30", 90, {
      event_type: "visit",
      location: "Contact centre",
      description: "Supervised family contact session. Record observations afterwards.",
      child_id: "yp_casey",
    }),
    // ── Tonight / early morning — populates the night shift running order ──
    make("cal_seed_night_bedtime", "Bedtime routines and welfare check", 0, "21:30", 30, {
      event_type: "meeting",
      location: "Each bedroom",
      description: "Settle-down check for all young people. Record welfare observations and any overnight concerns.",
    }),
    make("cal_seed_night_morning_meds", "Morning medication prep and review", 1, "07:00", 30, {
      event_type: "meeting",
      location: "Office",
      description: "Prepare morning MAR rounds. Check PRN records from overnight and brief incoming day shift.",
    }),
    make("cal_seed_team", "Weekly team meeting", 2, "10:00", 60, {
      event_type: "meeting",
      location: "Staff room",
      description: "Standing weekly check-in: handover themes, rota, actions.",
      recurrence: { freq: "weekly", interval: 1, until: null, count: null },
      attendees: [
        { id: "a1", kind: "staff", name: "Olivia Hayes", email: null, staff_id: "staff_olivia", response: "accepted" },
        { id: "a2", kind: "staff", name: "Marcus Bell", email: null, staff_id: "staff_ryan", response: "pending" },
      ],
    }),
    make("cal_seed_mdt", "MDT planning — placement", 4, "14:00", 90, {
      event_type: "review",
      location: "Meeting room 1",
      description: "Multi-agency planning meeting. Confirm actions and review pack.",
      attendees: [
        { id: "b1", kind: "external", name: "Social Worker (LA)", email: null, staff_id: null, response: "pending" },
        { id: "b2", kind: "external", name: "Virtual School", email: null, staff_id: null, response: "pending" },
      ],
    }),
    make("cal_seed_managers", "Registered managers' catch-up", 7, "11:30", 45, {
      event_type: "meeting",
      location: "Video call",
      description: "Cross-home practice and compliance catch-up.",
      recurrence: { freq: "monthly", interval: 1, until: null, count: null },
    }),
  ];
}
