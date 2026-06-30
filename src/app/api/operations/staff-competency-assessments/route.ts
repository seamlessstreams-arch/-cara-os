import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  COMPETENCY_AREAS, ASSESSMENT_METHODS, COMPETENCY_RATINGS, ACTIONS_REQUIRED,
} from "@/lib/services/staff-competency-assessment-service";
import type { CompetencyArea, AssessmentMethod, CompetencyRating, ActionRequired } from "@/lib/services/staff-competency-assessment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "competency_areas") return NextResponse.json({ ok: true, data: COMPETENCY_AREAS });
  if (type === "assessment_methods") return NextResponse.json({ ok: true, data: ASSESSMENT_METHODS });
  if (type === "competency_ratings") return NextResponse.json({ ok: true, data: COMPETENCY_RATINGS });
  if (type === "actions_required") return NextResponse.json({ ok: true, data: ACTIONS_REQUIRED });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    competencyArea: (searchParams.get("competencyArea") ?? undefined) as CompetencyArea | undefined,
    assessmentMethod: (searchParams.get("assessmentMethod") ?? undefined) as AssessmentMethod | undefined,
    competencyRating: (searchParams.get("competencyRating") ?? undefined) as CompetencyRating | undefined,
    actionRequired: (searchParams.get("actionRequired") ?? undefined) as ActionRequired | undefined,
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
