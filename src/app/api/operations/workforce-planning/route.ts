import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSnapshots,
  createSnapshot,
  listVacancies,
  createVacancy,
  updateVacancy,
  listSuccessionPlans,
  createSuccessionPlan,
  updateSuccessionPlan,
  STAFF_ROLES,
  VACANCY_STATUSES,
  SHIFT_TYPES,
  SUCCESSION_READINESS,
} from "@/lib/services/workforce-planning-service";
import type {
  VacancyStatus,
  StaffRole,
  SuccessionReadiness,
} from "@/lib/services/workforce-planning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "staff_roles") {
    return NextResponse.json({ ok: true, data: STAFF_ROLES });
  }
  if (type === "vacancy_statuses") {
    return NextResponse.json({ ok: true, data: VACANCY_STATUSES });
  }
  if (type === "shift_types") {
    return NextResponse.json({ ok: true, data: SHIFT_TYPES });
  }
  if (type === "succession_readiness") {
    return NextResponse.json({ ok: true, data: SUCCESSION_READINESS });
  }

  // Vacancies
  if (type === "vacancies") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listVacancies(homeId, {
      status: (searchParams.get("status") ?? undefined) as VacancyStatus | undefined,
      role: (searchParams.get("role") ?? undefined) as StaffRole | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Succession plans
  if (type === "succession") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listSuccessionPlans(homeId, {
      readiness: (searchParams.get("readiness") ?? undefined) as SuccessionReadiness | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Snapshots (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listSnapshots(homeId, {
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

  if (action === "create_snapshot") {
    const result = await createSnapshot(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_vacancy") {
    const result = await createVacancy(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_vacancy") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateVacancy(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_succession_plan") {
    const result = await createSuccessionPlan(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_succession_plan") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateSuccessionPlan(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
