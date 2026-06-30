import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listChecks,
  createCheck,
  listDebriefs,
  createDebrief,
  WELLBEING_RATINGS,
  STRESS_LEVELS,
  SUPPORT_TYPES,
  DEBRIEF_TRIGGERS,
} from "@/lib/services/staff-wellbeing-service";
import type {
  WellbeingRating,
  DebriefTrigger,
} from "@/lib/services/staff-wellbeing-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "wellbeing_ratings") {
    return NextResponse.json({ ok: true, data: WELLBEING_RATINGS });
  }
  if (type === "stress_levels") {
    return NextResponse.json({ ok: true, data: STRESS_LEVELS });
  }
  if (type === "support_types") {
    return NextResponse.json({ ok: true, data: SUPPORT_TYPES });
  }
  if (type === "debrief_triggers") {
    return NextResponse.json({ ok: true, data: DEBRIEF_TRIGGERS });
  }

  // Debriefs
  if (type === "debriefs") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listDebriefs(homeId, {
      trigger: (searchParams.get("trigger") ?? undefined) as DebriefTrigger | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Wellbeing checks (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listChecks(homeId, {
    staffMember: searchParams.get("staffMember") ?? undefined,
    wellbeingRating: (searchParams.get("wellbeingRating") ?? undefined) as WellbeingRating | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
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

  if (action === "create_check") {
    const result = await createCheck(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_debrief") {
    const result = await createDebrief(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
