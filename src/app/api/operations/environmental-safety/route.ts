import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listChecks,
  createCheck,
  updateCheck,
  listDrills,
  createDrill,
  CHECK_CATEGORIES,
  CHECK_FREQUENCIES,
  COMPLIANCE_STATUSES,
  CERTIFICATE_STATUSES,
  ACTION_PRIORITIES,
} from "@/lib/services/environmental-safety-service";
import type {
  CheckCategory,
  ComplianceStatus,
} from "@/lib/services/environmental-safety-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "check_categories") {
    return NextResponse.json({ ok: true, data: CHECK_CATEGORIES });
  }
  if (type === "check_frequencies") {
    return NextResponse.json({ ok: true, data: CHECK_FREQUENCIES });
  }
  if (type === "compliance_statuses") {
    return NextResponse.json({ ok: true, data: COMPLIANCE_STATUSES });
  }
  if (type === "certificate_statuses") {
    return NextResponse.json({ ok: true, data: CERTIFICATE_STATUSES });
  }
  if (type === "action_priorities") {
    return NextResponse.json({ ok: true, data: ACTION_PRIORITIES });
  }

  // Drills
  if (type === "drills") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listDrills(homeId, {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Checks (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listChecks(homeId, {
    category: (searchParams.get("category") ?? undefined) as CheckCategory | undefined,
    complianceStatus: (searchParams.get("complianceStatus") ?? undefined) as ComplianceStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_check") {
    const result = await createCheck(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_check") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateCheck(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_drill") {
    const result = await createDrill(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
