import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  RECORD_EVENT_TYPES,
  STORAGE_LOCATIONS,
  COMPLIANCE_RATINGS,
  ACCESS_DECISIONS,
} from "@/lib/services/secure-storage-service";
import type {
  RecordEventType,
  ComplianceRating,
} from "@/lib/services/secure-storage-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "record_event_types") return NextResponse.json({ ok: true, data: RECORD_EVENT_TYPES });
  if (type === "storage_locations") return NextResponse.json({ ok: true, data: STORAGE_LOCATIONS });
  if (type === "compliance_ratings") return NextResponse.json({ ok: true, data: COMPLIANCE_RATINGS });
  if (type === "access_decisions") return NextResponse.json({ ok: true, data: ACCESS_DECISIONS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    eventType: (searchParams.get("eventType") ?? undefined) as RecordEventType | undefined,
    complianceRating: (searchParams.get("complianceRating") ?? undefined) as ComplianceRating | undefined,
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
