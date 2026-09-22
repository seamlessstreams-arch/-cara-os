// CARA — /api/v1/calendar (unified feed + create planned event)
import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import {
  CreateEventSchema,
  createCalendarEvent,
  getCalendarFeed,
} from "@/lib/calendar/calendar-service";
import { ALL_CALENDAR_SOURCES, type CalendarSource } from "@/lib/calendar/calendar-types";
import { readJsonBody } from "@/lib/http/read-json";

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
  const feed = await getCalendarFeed({ from, to, sources });
  return NextResponse.json({ data: feed });
}

export async function POST(req: NextRequest) {
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  // The organiser is whoever is creating the event, taken from the session —
  // never the schema's demo default. Clients do not send organiser_id, so every
  // live event was stamped "staff_darren": a person who does not exist in
  // staff_members. That put a phantom recipient on each reminder notification
  // and assigned every linked task to nobody. In demo this resolves to the
  // x-user-id header, which is the same value the default used to supply.
  const event = createCalendarEvent({ ...parsed.data, organiser_id: identity.userId });
  return NextResponse.json({ data: { event } }, { status: 201 });
}
