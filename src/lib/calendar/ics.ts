// ══════════════════════════════════════════════════════════════════════════════
// CARA — iCalendar (.ics) invite builder (pure)
//
// Produces a standards-compliant VCALENDAR/VEVENT so a planned meeting can be
// shared as a real calendar invite — opened in Outlook/Google/Apple Calendar or
// attached to an email the user sends themselves. We deliberately DON'T send
// email from the server (that crosses the external-send boundary); the route
// returns this text for download + a mailto link, and notifies internal staff
// in-app. Deterministic: dtstamp is injected, never read from the clock here.
// ══════════════════════════════════════════════════════════════════════════════

import type { CalendarEvent } from "./calendar-types";

/** Escape per RFC 5545 §3.3.11 (TEXT): backslash, semicolon, comma, newline. */
function escapeText(value: string): string {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Naive-local ISO (2026-06-20T14:30:00) → floating iCal stamp (20260620T143000). */
function toIcsLocal(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return iso.replace(/[-:]/g, "");
  const [, y, mo, d, hh = "00", mi = "00", ss = "00"] = m;
  return `${y}${mo}${d}T${hh}${mi}${ss}`;
}

/** Date-only iCal value (VALUE=DATE) for all-day events: 20260620. */
function toIcsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Fold lines to 75 octets per RFC 5545 §3.1 (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

export interface IcsOptions {
  /** Injected timestamp (ISO) — keeps the output deterministic for tests. */
  dtstamp: string;
  organiserName: string;
  organiserEmail?: string | null;
  /** Resolved labels for the human-readable description. */
  childName?: string | null;
  /** Default end when an event has none: start + this many minutes. */
  defaultDurationMinutes?: number;
  method?: "PUBLISH" | "REQUEST";
}

function endOrDefault(event: CalendarEvent, defaultMinutes: number): string | null {
  if (event.end) return event.end;
  if (event.all_day) return null;
  const m = event.start.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + defaultMinutes;
  const hh = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
  const mi = String(total % 60).padStart(2, "0");
  return event.start.replace(/T\d{2}:\d{2}(:\d{2})?/, `T${hh}:${mi}:00`);
}

/** Build a full .ics document for one planned event. */
export function buildICS(event: CalendarEvent, opts: IcsOptions): string {
  const method = opts.method ?? "REQUEST";
  const dur = opts.defaultDurationMinutes ?? 60;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cara//Care Calendar//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${event.id}@cara`,
    `DTSTAMP:${toIcsLocal(opts.dtstamp)}`,
  ];

  if (event.all_day) {
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(event.start)}`);
    const end = event.end ?? event.start;
    // All-day DTEND is exclusive; nudge to next day so a single day renders right.
    lines.push(`DTEND;VALUE=DATE:${toIcsDate(end)}`);
  } else {
    lines.push(`DTSTART:${toIcsLocal(event.start)}`);
    const end = endOrDefault(event, dur);
    if (end) lines.push(`DTEND:${toIcsLocal(end)}`);
  }

  const descParts: string[] = [];
  if (event.description) descParts.push(event.description);
  if (opts.childName) descParts.push(`Young person: ${opts.childName}`);
  if (event.event_type) descParts.push(`Type: ${event.event_type}`);

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (descParts.length) lines.push(`DESCRIPTION:${escapeText(descParts.join("\n"))}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  lines.push(`STATUS:${event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`);

  const orgEmail = opts.organiserEmail || "no-reply@cara.local";
  lines.push(`ORGANIZER;CN=${escapeText(opts.organiserName)}:mailto:${orgEmail}`);

  for (const a of event.attendees) {
    const email = a.email || "no-reply@cara.local";
    const partstat =
      a.response === "accepted"
        ? "ACCEPTED"
        : a.response === "declined"
          ? "DECLINED"
          : a.response === "tentative"
            ? "TENTATIVE"
            : "NEEDS-ACTION";
    lines.push(
      `ATTENDEE;CN=${escapeText(a.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=${partstat};RSVP=TRUE:mailto:${email}`,
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

/** A mailto: link the organiser can click to send the invite from their own client. */
export function buildInviteMailto(event: CalendarEvent, opts: { childName?: string | null }): string {
  const to = event.attendees
    .map((a) => a.email)
    .filter((e): e is string => Boolean(e))
    .join(",");
  const subjectBits = [event.title];
  if (opts.childName) subjectBits.push(`(${opts.childName})`);
  const when = event.all_day
    ? event.start.slice(0, 10)
    : event.start.replace("T", " ").slice(0, 16);
  const bodyLines = [
    `You're invited to: ${event.title}`,
    `When: ${when}`,
    event.location ? `Where: ${event.location}` : "",
    event.description ? `\n${event.description}` : "",
    "\nA calendar invite (.ics) is attached from Cara.",
  ].filter(Boolean);
  const params = new URLSearchParams({
    subject: `Invite: ${subjectBits.join(" ")}`,
    body: bodyLines.join("\n"),
  });
  return `mailto:${to}?${params.toString()}`;
}
