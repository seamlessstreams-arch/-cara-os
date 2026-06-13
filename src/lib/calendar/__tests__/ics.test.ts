import { describe, expect, it } from "vitest";
import { buildICS, buildInviteMailto } from "../ics";
import type { CalendarEvent } from "../calendar-types";

function event(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "evt_123",
    home_id: "home_oak",
    title: "Placement review, planning",
    description: "Discuss next steps",
    event_type: "review",
    start: "2026-06-20T14:00:00",
    end: "2026-06-20T15:30:00",
    all_day: false,
    location: "Main office; room 2",
    child_id: "yp-001",
    organiser_id: "staff-001",
    attendees: [
      { id: "1", kind: "staff", name: "Olivia Hayes", email: "olivia@home.example", staff_id: "staff-001", response: "accepted" },
      { id: "2", kind: "external", name: "Social Worker", email: "sw@council.example", staff_id: null, response: "pending" },
    ],
    linked_task_ids: [],
    reminder_minutes_before: 60,
    reminder_sent: false,
    invite_sent: false,
    status: "scheduled",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    created_by: "staff-001",
    ...over,
  };
}

const DTSTAMP = "2026-06-13T09:00:00Z";

describe("buildICS", () => {
  it("wraps a valid VCALENDAR/VEVENT", () => {
    const ics = buildICS(event(), { dtstamp: DTSTAMP, organiserName: "Olivia Hayes" });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:evt_123@cara");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    // CRLF line endings per RFC 5545
    expect(ics).toContain("\r\n");
  });

  it("emits floating local DTSTART/DTEND", () => {
    const ics = buildICS(event(), { dtstamp: DTSTAMP, organiserName: "Olivia" });
    expect(ics).toContain("DTSTART:20260620T140000");
    expect(ics).toContain("DTEND:20260620T153000");
    expect(ics).toContain("DTSTAMP:20260613T090000");
  });

  it("escapes commas and semicolons in text fields", () => {
    const ics = buildICS(event(), { dtstamp: DTSTAMP, organiserName: "Olivia" });
    expect(ics).toContain("SUMMARY:Placement review\\, planning");
    expect(ics).toContain("LOCATION:Main office\\; room 2");
  });

  it("renders organiser and each attendee with PARTSTAT", () => {
    const ics = buildICS(event(), { dtstamp: DTSTAMP, organiserName: "Olivia Hayes", organiserEmail: "olivia@home.example" });
    expect(ics).toContain("ORGANIZER;CN=Olivia Hayes:mailto:olivia@home.example");
    expect(ics).toContain("PARTSTAT=ACCEPTED");
    expect(ics).toContain("PARTSTAT=NEEDS-ACTION");
    expect(ics).toContain("mailto:sw@council.example");
  });

  it("includes the child name in the description when provided", () => {
    const ics = buildICS(event(), { dtstamp: DTSTAMP, organiserName: "Olivia", childName: "Alex" });
    expect(ics).toContain("Young person: Alex");
  });

  it("uses VALUE=DATE for all-day events and defaults a timed end", () => {
    const allDay = buildICS(event({ all_day: true, start: "2026-06-20T00:00:00", end: null }), {
      dtstamp: DTSTAMP,
      organiserName: "Olivia",
    });
    expect(allDay).toContain("DTSTART;VALUE=DATE:20260620");
    expect(allDay).toContain("DTEND;VALUE=DATE:20260620");

    const noEnd = buildICS(event({ end: null }), { dtstamp: DTSTAMP, organiserName: "Olivia", defaultDurationMinutes: 30 });
    expect(noEnd).toContain("DTSTART:20260620T140000");
    expect(noEnd).toContain("DTEND:20260620T143000");
  });

  it("marks cancelled events CANCELLED", () => {
    const ics = buildICS(event({ status: "cancelled" }), { dtstamp: DTSTAMP, organiserName: "Olivia" });
    expect(ics).toContain("STATUS:CANCELLED");
  });
});

describe("buildInviteMailto", () => {
  it("addresses all attendee emails and pre-fills subject/body", () => {
    const url = buildInviteMailto(event(), { childName: "Alex" });
    expect(url.startsWith("mailto:olivia@home.example,sw@council.example?")).toBe(true);
    expect(url).toContain("subject=");
    // URLSearchParams encodes spaces as "+"; normalise before checking text.
    const decoded = decodeURIComponent(url).replace(/\+/g, " ");
    expect(decoded).toContain("Placement review, planning");
    expect(decoded).toContain("Alex");
  });
});
