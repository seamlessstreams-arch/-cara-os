import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  ATTACHMENT_STYLES,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_QUALITIES,
  THERAPEUTIC_APPROACHES,
  ASSESSMENT_STATUSES,
} from "@/lib/services/attachment-relationships-service";
import type {
  AttachmentStyle,
  RelationshipType,
  AssessmentStatus,
} from "@/lib/services/attachment-relationships-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "attachment_styles") return NextResponse.json({ ok: true, data: ATTACHMENT_STYLES });
  if (type === "relationship_types") return NextResponse.json({ ok: true, data: RELATIONSHIP_TYPES });
  if (type === "relationship_qualities") return NextResponse.json({ ok: true, data: RELATIONSHIP_QUALITIES });
  if (type === "therapeutic_approaches") return NextResponse.json({ ok: true, data: THERAPEUTIC_APPROACHES });
  if (type === "assessment_statuses") return NextResponse.json({ ok: true, data: ASSESSMENT_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    attachmentStyle: (searchParams.get("attachmentStyle") ?? undefined) as AttachmentStyle | undefined,
    relationshipType: (searchParams.get("relationshipType") ?? undefined) as RelationshipType | undefined,
    assessmentStatus: (searchParams.get("assessmentStatus") ?? undefined) as AssessmentStatus | undefined,
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
