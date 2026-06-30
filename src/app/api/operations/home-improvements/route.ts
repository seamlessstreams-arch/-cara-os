import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  PROJECT_TYPES,
  PROJECT_STATUSES,
  PRIORITY_LEVELS,
  FUNDING_SOURCES,
} from "@/lib/services/home-improvement-service";
import type {
  ProjectType,
  ProjectStatus,
  PriorityLevel,
} from "@/lib/services/home-improvement-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "project_types") return NextResponse.json({ ok: true, data: PROJECT_TYPES });
  if (type === "project_statuses") return NextResponse.json({ ok: true, data: PROJECT_STATUSES });
  if (type === "priority_levels") return NextResponse.json({ ok: true, data: PRIORITY_LEVELS });
  if (type === "funding_sources") return NextResponse.json({ ok: true, data: FUNDING_SOURCES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    projectType: (searchParams.get("projectType") ?? undefined) as ProjectType | undefined,
    projectStatus: (searchParams.get("projectStatus") ?? undefined) as ProjectStatus | undefined,
    priorityLevel: (searchParams.get("priorityLevel") ?? undefined) as PriorityLevel | undefined,
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
