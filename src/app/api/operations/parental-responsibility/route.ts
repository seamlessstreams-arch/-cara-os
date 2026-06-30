import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  CARE_ORDER_TYPES,
  PR_HOLDERS,
  PR_STATUSES,
  CONSENT_ARRANGEMENTS,
} from "@/lib/services/parental-responsibility-service";
import type {
  CareOrderType,
  PrStatus,
} from "@/lib/services/parental-responsibility-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "care_order_types") return NextResponse.json({ ok: true, data: CARE_ORDER_TYPES });
  if (type === "pr_holders") return NextResponse.json({ ok: true, data: PR_HOLDERS });
  if (type === "pr_statuses") return NextResponse.json({ ok: true, data: PR_STATUSES });
  if (type === "consent_arrangements") return NextResponse.json({ ok: true, data: CONSENT_ARRANGEMENTS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    careOrderType: (searchParams.get("careOrderType") ?? undefined) as CareOrderType | undefined,
    prStatus: (searchParams.get("prStatus") ?? undefined) as PrStatus | undefined,
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
