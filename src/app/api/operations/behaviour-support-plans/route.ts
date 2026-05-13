import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlans,
  createPlan,
  updatePlan,
  BSP_STATUSES,
  STRATEGY_CATEGORIES,
  TRIGGER_CATEGORIES,
  EFFECTIVENESS_RATINGS,
} from "@/lib/services/behaviour-support-plans-service";
import type {
  BspStatus,
  EffectivenessRating,
} from "@/lib/services/behaviour-support-plans-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "bsp_statuses") return NextResponse.json({ ok: true, data: BSP_STATUSES });
  if (type === "strategy_categories") return NextResponse.json({ ok: true, data: STRATEGY_CATEGORIES });
  if (type === "trigger_categories") return NextResponse.json({ ok: true, data: TRIGGER_CATEGORIES });
  if (type === "effectiveness_ratings") return NextResponse.json({ ok: true, data: EFFECTIVENESS_RATINGS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listPlans(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    bspStatus: (searchParams.get("bspStatus") ?? undefined) as BspStatus | undefined,
    effectivenessRating: (searchParams.get("effectivenessRating") ?? undefined) as EffectivenessRating | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_plan") {
    const result = await createPlan(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_plan") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updatePlan(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
