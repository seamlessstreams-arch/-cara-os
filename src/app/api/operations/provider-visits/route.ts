import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listVisits,
  createVisit,
  updateVisit,
  VISIT_TYPES,
  VISIT_OUTCOMES,
  VISIT_STATUSES,
} from "@/lib/services/provider-visits-service";
import type {
  VisitType,
  VisitStatus,
} from "@/lib/services/provider-visits-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "visit_types") return NextResponse.json({ ok: true, data: VISIT_TYPES });
  if (type === "visit_outcomes") return NextResponse.json({ ok: true, data: VISIT_OUTCOMES });
  if (type === "visit_statuses") return NextResponse.json({ ok: true, data: VISIT_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listVisits(homeId, {
    visitType: (searchParams.get("visitType") ?? undefined) as VisitType | undefined,
    visitStatus: (searchParams.get("visitStatus") ?? undefined) as VisitStatus | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_visit") {
    const result = await createVisit(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_visit") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateVisit(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
