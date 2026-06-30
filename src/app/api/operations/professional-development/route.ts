import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listCpdRecords,
  createCpdRecord,
  listQualifications,
  createQualification,
  updateQualification,
  listGoals,
  createGoal,
  updateGoal,
  CPD_CATEGORIES,
  CPD_METHODS,
  QUALIFICATION_STATUSES,
  DEVELOPMENT_GOAL_STATUSES,
  REGISTRATION_BODIES,
} from "@/lib/services/professional-development-service";
import type {
  CpdCategory,
  QualificationStatus,
  DevelopmentGoalStatus,
} from "@/lib/services/professional-development-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "cpd_categories") {
    return NextResponse.json({ ok: true, data: CPD_CATEGORIES });
  }
  if (type === "cpd_methods") {
    return NextResponse.json({ ok: true, data: CPD_METHODS });
  }
  if (type === "qualification_statuses") {
    return NextResponse.json({ ok: true, data: QUALIFICATION_STATUSES });
  }
  if (type === "goal_statuses") {
    return NextResponse.json({ ok: true, data: DEVELOPMENT_GOAL_STATUSES });
  }
  if (type === "registration_bodies") {
    return NextResponse.json({ ok: true, data: REGISTRATION_BODIES });
  }

  // Qualifications
  if (type === "qualifications") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listQualifications(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as QualificationStatus | undefined,
      mandatory: searchParams.get("mandatory") ? searchParams.get("mandatory") === "true" : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Development goals
  if (type === "goals") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listGoals(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as DevelopmentGoalStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // CPD records (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listCpdRecords(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    category: (searchParams.get("category") ?? undefined) as CpdCategory | undefined,
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

  if (action === "create_cpd_record") {
    const result = await createCpdRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_qualification") {
    const result = await createQualification(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_qualification") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateQualification(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_goal") {
    const result = await createGoal(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_goal") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateGoal(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
