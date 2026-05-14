import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  KEY_EVENT_TYPES,
  KEY_TYPES,
  KEY_STATUSES,
  AUDIT_RESULTS,
} from "@/lib/services/key-holding-service";
import type {
  KeyEventType,
  KeyType,
  KeyStatus,
} from "@/lib/services/key-holding-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "key_event_types") return NextResponse.json({ ok: true, data: KEY_EVENT_TYPES });
  if (type === "key_types") return NextResponse.json({ ok: true, data: KEY_TYPES });
  if (type === "key_statuses") return NextResponse.json({ ok: true, data: KEY_STATUSES });
  if (type === "audit_results") return NextResponse.json({ ok: true, data: AUDIT_RESULTS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    keyEventType: (searchParams.get("keyEventType") ?? undefined) as KeyEventType | undefined,
    keyType: (searchParams.get("keyType") ?? undefined) as KeyType | undefined,
    keyStatus: (searchParams.get("keyStatus") ?? undefined) as KeyStatus | undefined,
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
