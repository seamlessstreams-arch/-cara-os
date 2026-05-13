import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listMoves,
  createMove,
  updateMove,
  PLACEMENT_TYPES,
  MOVE_REASONS,
  STABILITY_RISKS,
  DISRUPTION_OUTCOMES,
} from "@/lib/services/placement-stability-service";
import type {
  PlacementType,
  MoveReason,
} from "@/lib/services/placement-stability-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "placement_types") {
    return NextResponse.json({ ok: true, data: PLACEMENT_TYPES });
  }
  if (type === "move_reasons") {
    return NextResponse.json({ ok: true, data: MOVE_REASONS });
  }
  if (type === "stability_risks") {
    return NextResponse.json({ ok: true, data: STABILITY_RISKS });
  }
  if (type === "disruption_outcomes") {
    return NextResponse.json({ ok: true, data: DISRUPTION_OUTCOMES });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listMoves(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    placementType: (searchParams.get("placementType") ?? undefined) as PlacementType | undefined,
    moveReason: (searchParams.get("moveReason") ?? undefined) as MoveReason | undefined,
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

  if (action === "create_move") {
    const result = await createMove(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_move") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateMove(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
