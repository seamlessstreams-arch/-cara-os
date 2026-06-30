import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listChecks,
  createCheck,
  listRecords,
  createRecord,
  SLEEP_QUALITIES,
  DISTURBANCE_TYPES,
  CHECK_OUTCOMES,
  CONCERN_SEVERITIES,
} from "@/lib/services/sleep-patterns-service";
import type {
  SleepQuality,
} from "@/lib/services/sleep-patterns-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "sleep_qualities") {
    return NextResponse.json({ ok: true, data: SLEEP_QUALITIES });
  }
  if (type === "disturbance_types") {
    return NextResponse.json({ ok: true, data: DISTURBANCE_TYPES });
  }
  if (type === "check_outcomes") {
    return NextResponse.json({ ok: true, data: CHECK_OUTCOMES });
  }
  if (type === "concern_severities") {
    return NextResponse.json({ ok: true, data: CONCERN_SEVERITIES });
  }

  // Sleep records
  if (type === "records") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRecords(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      sleepQuality: (searchParams.get("sleepQuality") ?? undefined) as SleepQuality | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Night checks (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listChecks(homeId, {
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
  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
