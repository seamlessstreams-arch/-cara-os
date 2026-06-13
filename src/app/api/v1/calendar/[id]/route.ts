// CARA — /api/v1/calendar/[id] (get / update / reschedule / cancel / RSVP)
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import {
  UpdateEventSchema,
  setAttendeeResponse,
  updateCalendarEvent,
} from "@/lib/calendar/calendar-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const event = db.calendarEvents.findById(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ data: { event } });
}

const RsvpSchema = z.object({
  rsvp: z.object({
    attendee_id: z.string().min(1),
    response: z.enum(["pending", "accepted", "declined", "tentative"]),
  }),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  // RSVP branch: { rsvp: { attendee_id, response } }
  const rsvp = RsvpSchema.safeParse(body);
  if (rsvp.success) {
    const updated = setAttendeeResponse(id, rsvp.data.rsvp.attendee_id, rsvp.data.rsvp.response);
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ data: { event: updated } });
  }

  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const updated = updateCalendarEvent(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ data: { event: updated } });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const updated = updateCalendarEvent(id, { status: "cancelled" });
  if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ data: { event: updated } });
}
