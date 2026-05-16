import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  RECORD_TYPES,
  SUBSTANCES,
  USAGE_FREQUENCIES,
  MOTIVATION_STAGES,
} from "@/lib/services/smoking-vaping-management-service";
import type {
  RecordType,
  Substance,
  UsageFrequency,
  MotivationStage,
} from "@/lib/services/smoking-vaping-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "record_types") return NextResponse.json({ ok: true, data: RECORD_TYPES });
  if (type === "substances") return NextResponse.json({ ok: true, data: SUBSTANCES });
  if (type === "usage_frequencies") return NextResponse.json({ ok: true, data: USAGE_FREQUENCIES });
  if (type === "motivation_stages") return NextResponse.json({ ok: true, data: MOTIVATION_STAGES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    recordType: (searchParams.get("recordType") ?? undefined) as RecordType | undefined,
    substance: (searchParams.get("substance") ?? undefined) as Substance | undefined,
    usageFrequency: (searchParams.get("usageFrequency") ?? undefined) as UsageFrequency | undefined,
    motivationStage: (searchParams.get("motivationStage") ?? undefined) as MotivationStage | undefined,
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
