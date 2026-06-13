// CARA — /api/v1/calendar (unified feed + create planned event)
import { NextResponse } from "next/server";
import {
  CreateEventSchema,
  createCalendarEvent,
  getCalendarFeed,
} from "@/lib/calendar/calendar-service";
import { ALL_CALENDAR_SOURCES, type CalendarSource } from "@/lib/calendar/calendar-types";

export const dynamic = "force-dynamic";

function parseSources(raw: string | null): CalendarSource[] | undefined {
  if (!raw) return undefined;
  const set = new Set(ALL_CALENDAR_SOURCES);
  const picked = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is CalendarSource => set.has(s as CalendarSource));
  return picked.length ? picked : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const sources = parseSources(url.searchParams.get("sources"));
  const feed = getCalendarFeed({ from, to, sources });
  return NextResponse.json({ data: feed });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const event = createCalendarEvent(parsed.data);
  return NextResponse.json({ data: { event } }, { status: 201 });
}
