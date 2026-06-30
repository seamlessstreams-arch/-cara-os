import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  FAMILY_ROLES,
  SUPPORT_TYPES,
  EMOTIONAL_RESPONSES,
  STATUSES,
} from "@/lib/services/birth-family-contact-support-service";
import type {
  FamilyRole,
  SupportType,
  Status,
} from "@/lib/services/birth-family-contact-support-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "family_roles") return NextResponse.json({ ok: true, data: FAMILY_ROLES });
  if (type === "support_types") return NextResponse.json({ ok: true, data: SUPPORT_TYPES });
  if (type === "emotional_responses") return NextResponse.json({ ok: true, data: EMOTIONAL_RESPONSES });
  if (type === "statuses") return NextResponse.json({ ok: true, data: STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    familyRole: (searchParams.get("familyRole") ?? undefined) as FamilyRole | undefined,
    supportType: (searchParams.get("supportType") ?? undefined) as SupportType | undefined,
    status: (searchParams.get("status") ?? undefined) as Status | undefined,
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
