import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  PANEL_TYPES,
  PANEL_DECISIONS,
  PANEL_QUORUMS,
  FOLLOW_UP_STATUSES,
} from "@/lib/services/panel-decisions-service";
import type {
  PanelType,
  PanelDecision,
  PanelQuorum,
} from "@/lib/services/panel-decisions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "panel_types") return NextResponse.json({ ok: true, data: PANEL_TYPES });
  if (type === "panel_decisions") return NextResponse.json({ ok: true, data: PANEL_DECISIONS });
  if (type === "panel_quorums") return NextResponse.json({ ok: true, data: PANEL_QUORUMS });
  if (type === "follow_up_statuses") return NextResponse.json({ ok: true, data: FOLLOW_UP_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    panelType: (searchParams.get("panelType") ?? undefined) as PanelType | undefined,
    panelDecision: (searchParams.get("panelDecision") ?? undefined) as PanelDecision | undefined,
    panelQuorum: (searchParams.get("panelQuorum") ?? undefined) as PanelQuorum | undefined,
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
