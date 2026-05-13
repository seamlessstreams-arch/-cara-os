import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listProceedings,
  createProceeding,
  updateProceeding,
  PROCEEDING_TYPES,
  PROCEEDING_STATUSES,
  HEARING_TYPES,
  STATEMENT_STATUSES,
} from "@/lib/services/court-proceedings-service";
import type {
  ProceedingType,
  ProceedingStatus,
} from "@/lib/services/court-proceedings-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "proceeding_types") return NextResponse.json({ ok: true, data: PROCEEDING_TYPES });
  if (type === "proceeding_statuses") return NextResponse.json({ ok: true, data: PROCEEDING_STATUSES });
  if (type === "hearing_types") return NextResponse.json({ ok: true, data: HEARING_TYPES });
  if (type === "statement_statuses") return NextResponse.json({ ok: true, data: STATEMENT_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listProceedings(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    proceedingType: (searchParams.get("proceedingType") ?? undefined) as ProceedingType | undefined,
    proceedingStatus: (searchParams.get("proceedingStatus") ?? undefined) as ProceedingStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_proceeding") {
    const result = await createProceeding(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_proceeding") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateProceeding(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
