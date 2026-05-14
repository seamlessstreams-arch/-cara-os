import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  AUDIT_AREAS, AUDIT_RATINGS, AUDIT_TYPES, PRIORITY_LEVELS,
} from "@/lib/services/environmental-audit-service";
import type { AuditArea, AuditRating, AuditType, PriorityLevel } from "@/lib/services/environmental-audit-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "audit_areas") return NextResponse.json({ ok: true, data: AUDIT_AREAS });
  if (type === "audit_ratings") return NextResponse.json({ ok: true, data: AUDIT_RATINGS });
  if (type === "audit_types") return NextResponse.json({ ok: true, data: AUDIT_TYPES });
  if (type === "priority_levels") return NextResponse.json({ ok: true, data: PRIORITY_LEVELS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    auditArea: (searchParams.get("auditArea") ?? undefined) as AuditArea | undefined,
    auditRating: (searchParams.get("auditRating") ?? undefined) as AuditRating | undefined,
    auditType: (searchParams.get("auditType") ?? undefined) as AuditType | undefined,
    priorityLevel: (searchParams.get("priorityLevel") ?? undefined) as PriorityLevel | undefined,
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
