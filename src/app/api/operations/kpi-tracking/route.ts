import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listDefinitions,
  createDefinition,
  updateDefinition,
  listMeasurements,
  createMeasurement,
  KPI_DOMAINS,
  KPI_STATUSES,
  KPI_FREQUENCIES,
  TREND_DIRECTIONS,
} from "@/lib/services/kpi-tracking-service";
import type {
  KpiDomain,
  KpiStatus,
} from "@/lib/services/kpi-tracking-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "kpi_domains") {
    return NextResponse.json({ ok: true, data: KPI_DOMAINS });
  }
  if (type === "kpi_statuses") {
    return NextResponse.json({ ok: true, data: KPI_STATUSES });
  }
  if (type === "kpi_frequencies") {
    return NextResponse.json({ ok: true, data: KPI_FREQUENCIES });
  }
  if (type === "trend_directions") {
    return NextResponse.json({ ok: true, data: TREND_DIRECTIONS });
  }

  // Measurements
  if (type === "measurements") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMeasurements(homeId, {
      kpiId: searchParams.get("kpiId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as KpiStatus | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Definitions (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listDefinitions(homeId, {
    domain: (searchParams.get("domain") ?? undefined) as KpiDomain | undefined,
    active: searchParams.get("active") ? searchParams.get("active") === "true" : undefined,
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

  if (action === "create_definition") {
    const result = await createDefinition(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_definition") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateDefinition(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_measurement") {
    const result = await createMeasurement(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
