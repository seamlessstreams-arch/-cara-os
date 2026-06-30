import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  ACTIVITY_TYPES, ENGAGEMENT_LEVELS, LINK_STATUSES, FUNDING_SOURCES,
} from "@/lib/services/community-links-integration-service";
import type { ActivityType, EngagementLevel, LinkStatus, FundingSource } from "@/lib/services/community-links-integration-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "activity_types") return NextResponse.json({ ok: true, data: ACTIVITY_TYPES });
  if (type === "engagement_levels") return NextResponse.json({ ok: true, data: ENGAGEMENT_LEVELS });
  if (type === "link_statuses") return NextResponse.json({ ok: true, data: LINK_STATUSES });
  if (type === "funding_sources") return NextResponse.json({ ok: true, data: FUNDING_SOURCES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    activityType: (searchParams.get("activityType") ?? undefined) as ActivityType | undefined,
    engagementLevel: (searchParams.get("engagementLevel") ?? undefined) as EngagementLevel | undefined,
    linkStatus: (searchParams.get("linkStatus") ?? undefined) as LinkStatus | undefined,
    fundingSource: (searchParams.get("fundingSource") ?? undefined) as FundingSource | undefined,
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
