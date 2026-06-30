import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAudits,
  createAudit,
  listProfiles,
  createProfile,
  updateProfile,
  RIGHTS_CATEGORIES,
  RIGHTS_CHECK_OUTCOMES,
  EMPOWERMENT_LEVELS,
} from "@/lib/services/childrens-rights-service";
import type {
  EmpowermentLevel,
} from "@/lib/services/childrens-rights-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "rights_categories") {
    return NextResponse.json({ ok: true, data: RIGHTS_CATEGORIES });
  }
  if (type === "check_outcomes") {
    return NextResponse.json({ ok: true, data: RIGHTS_CHECK_OUTCOMES });
  }
  if (type === "empowerment_levels") {
    return NextResponse.json({ ok: true, data: EMPOWERMENT_LEVELS });
  }

  // Profiles
  if (type === "profiles") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listProfiles(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      empowermentLevel: (searchParams.get("empowermentLevel") ?? undefined) as EmpowermentLevel | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Audits (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAudits(homeId, {
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

  if (action === "create_audit") {
    const result = await createAudit(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_profile") {
    const result = await createProfile(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_profile") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateProfile(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
