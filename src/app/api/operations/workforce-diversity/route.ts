import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  DIVERSITY_CATEGORIES,
  TRAINING_STATUSES,
  ADJUSTMENT_STATUSES,
  EIA_OUTCOMES,
} from "@/lib/services/workforce-diversity-service";
import type {
  DiversityCategory,
  TrainingStatus,
} from "@/lib/services/workforce-diversity-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "diversity_categories") return NextResponse.json({ ok: true, data: DIVERSITY_CATEGORIES });
  if (type === "training_statuses") return NextResponse.json({ ok: true, data: TRAINING_STATUSES });
  if (type === "adjustment_statuses") return NextResponse.json({ ok: true, data: ADJUSTMENT_STATUSES });
  if (type === "eia_outcomes") return NextResponse.json({ ok: true, data: EIA_OUTCOMES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    diversityCategory: (searchParams.get("diversityCategory") ?? undefined) as DiversityCategory | undefined,
    trainingStatus: (searchParams.get("trainingStatus") ?? undefined) as TrainingStatus | undefined,
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
