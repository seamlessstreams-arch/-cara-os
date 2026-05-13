import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listEvents,
  createEvent,
  updateEvent,
  listActions,
  createAction,
  updateAction,
  LEARNING_SOURCES,
  LEARNING_PRIORITIES,
  ACTION_STATUSES,
  IMPACT_LEVELS,
} from "@/lib/services/practice-learning-service";
import type {
  LearningSource,
  LearningPriority,
  ActionStatus,
} from "@/lib/services/practice-learning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "learning_sources") {
    return NextResponse.json({ ok: true, data: LEARNING_SOURCES });
  }
  if (type === "learning_priorities") {
    return NextResponse.json({ ok: true, data: LEARNING_PRIORITIES });
  }
  if (type === "action_statuses") {
    return NextResponse.json({ ok: true, data: ACTION_STATUSES });
  }
  if (type === "impact_levels") {
    return NextResponse.json({ ok: true, data: IMPACT_LEVELS });
  }

  // Actions
  if (type === "actions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listActions(homeId, {
      learningEventId: searchParams.get("learningEventId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as ActionStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Events (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listEvents(homeId, {
    source: (searchParams.get("source") ?? undefined) as LearningSource | undefined,
    priority: (searchParams.get("priority") ?? undefined) as LearningPriority | undefined,
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
  if (action === "create_action") {
    const result = await createAction(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_action") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAction(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
