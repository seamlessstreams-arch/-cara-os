import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listEvents,
  createEvent,
  updateEvent,
  EVENT_CATEGORIES,
  EVENT_SENTIMENTS,
  EVENT_IMPACTS,
} from "@/lib/services/significant-events-service";
import type {
  EventCategory,
  EventSentiment,
} from "@/lib/services/significant-events-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "event_categories") {
    return NextResponse.json({ ok: true, data: EVENT_CATEGORIES });
  }
  if (type === "event_sentiments") {
    return NextResponse.json({ ok: true, data: EVENT_SENTIMENTS });
  }
  if (type === "event_impacts") {
    return NextResponse.json({ ok: true, data: EVENT_IMPACTS });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listEvents(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    category: (searchParams.get("category") ?? undefined) as EventCategory | undefined,
    sentiment: (searchParams.get("sentiment") ?? undefined) as EventSentiment | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_event") {
    const result = await createEvent(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_event") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateEvent(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
