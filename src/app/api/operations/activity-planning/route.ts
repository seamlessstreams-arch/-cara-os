import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listActivities,
  createActivity,
  updateActivity,
  listParticipations,
  createParticipation,
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUSES,
  PARTICIPATION_LEVELS,
  ENJOYMENT_RATINGS,
} from "@/lib/services/activity-planning-service";
import type {
  ActivityCategory,
  ActivityStatus,
} from "@/lib/services/activity-planning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "activity_categories") {
    return NextResponse.json({ ok: true, data: ACTIVITY_CATEGORIES });
  }
  if (type === "activity_statuses") {
    return NextResponse.json({ ok: true, data: ACTIVITY_STATUSES });
  }
  if (type === "participation_levels") {
    return NextResponse.json({ ok: true, data: PARTICIPATION_LEVELS });
  }
  if (type === "enjoyment_ratings") {
    return NextResponse.json({ ok: true, data: ENJOYMENT_RATINGS });
  }

  // Participations
  if (type === "participations") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listParticipations(homeId, {
      activityId: searchParams.get("activityId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Activities (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listActivities(homeId, {
    category: (searchParams.get("category") ?? undefined) as ActivityCategory | undefined,
    status: (searchParams.get("status") ?? undefined) as ActivityStatus | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_activity") {
    const result = await createActivity(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_activity") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateActivity(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_participation") {
    const result = await createParticipation(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
