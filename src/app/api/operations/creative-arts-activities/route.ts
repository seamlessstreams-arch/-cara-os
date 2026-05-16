import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  ACTIVITY_TYPES,
  GROUP_TYPES,
  ENGAGEMENT_LEVELS,
  MOOD_LEVELS,
} from "@/lib/services/creative-arts-activities-service";
import type {
  ActivityType,
  EngagementLevel,
} from "@/lib/services/creative-arts-activities-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "activity_types") return NextResponse.json({ ok: true, data: ACTIVITY_TYPES });
  if (type === "group_types") return NextResponse.json({ ok: true, data: GROUP_TYPES });
  if (type === "engagement_levels") return NextResponse.json({ ok: true, data: ENGAGEMENT_LEVELS });
  if (type === "mood_levels") return NextResponse.json({ ok: true, data: MOOD_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    activityType: (searchParams.get("activityType") ?? undefined) as ActivityType | undefined,
    engagementLevel: (searchParams.get("engagementLevel") ?? undefined) as EngagementLevel | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
