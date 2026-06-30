import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlacements,
  createPlacement,
  updatePlacement,
  EMERGENCY_REASONS,
  PLACEMENT_DECISIONS,
  RISK_ASSESSMENT_STATUSES,
  POST_ADMISSION_REVIEWS,
  EMERGENCY_STATUSES,
} from "@/lib/services/emergency-placement-service";
import type {
  EmergencyReason,
  PlacementDecision,
  EmergencyStatus,
} from "@/lib/services/emergency-placement-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "emergency_reasons") return NextResponse.json({ ok: true, data: EMERGENCY_REASONS });
  if (type === "placement_decisions") return NextResponse.json({ ok: true, data: PLACEMENT_DECISIONS });
  if (type === "risk_assessment_statuses") return NextResponse.json({ ok: true, data: RISK_ASSESSMENT_STATUSES });
  if (type === "post_admission_reviews") return NextResponse.json({ ok: true, data: POST_ADMISSION_REVIEWS });
  if (type === "emergency_statuses") return NextResponse.json({ ok: true, data: EMERGENCY_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listPlacements(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    emergencyReason: (searchParams.get("emergencyReason") ?? undefined) as EmergencyReason | undefined,
    placementDecision: (searchParams.get("placementDecision") ?? undefined) as PlacementDecision | undefined,
    emergencyStatus: (searchParams.get("emergencyStatus") ?? undefined) as EmergencyStatus | undefined,
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

  if (action === "create_placement") {
    const result = await createPlacement(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_placement") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updatePlacement(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
