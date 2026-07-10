import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "@/lib/permissions/sensitive-access";
import {
  listRecords,
  createRecord,
  updateRecord,
  LEAVING_REASONS,
  SATISFACTION_RATINGS,
  HANDOVER_STATUSES,
  REHIRE_RECOMMENDATIONS,
} from "@/lib/services/staff-exit-interviews-service";
import type {
  LeavingReason,
  SatisfactionRating,
  HandoverStatus,
} from "@/lib/services/staff-exit-interviews-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  const guard = await requireSensitiveAccess(request, PERMISSIONS.VIEW_STAFF_HR_CONFIDENTIAL, { entityType: "staff_exit_interview", homeId });
  if (guard instanceof NextResponse) return guard;

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "leaving_reasons") return NextResponse.json({ ok: true, data: LEAVING_REASONS });
  if (type === "satisfaction_ratings") return NextResponse.json({ ok: true, data: SATISFACTION_RATINGS });
  if (type === "handover_statuses") return NextResponse.json({ ok: true, data: HANDOVER_STATUSES });
  if (type === "rehire_recommendations") return NextResponse.json({ ok: true, data: REHIRE_RECOMMENDATIONS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    leavingReason: (searchParams.get("leavingReason") ?? undefined) as LeavingReason | undefined,
    satisfactionRating: (searchParams.get("satisfactionRating") ?? undefined) as SatisfactionRating | undefined,
    handoverStatus: (searchParams.get("handoverStatus") ?? undefined) as HandoverStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_STAFF_HR_CONFIDENTIAL, { entityType: "staff_exit_interview", action: "update" });
  if (guard instanceof NextResponse) return guard;

  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
