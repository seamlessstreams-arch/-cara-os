import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSessions,
  createSession,
  updateSession,
  CONTACT_TYPES,
  SUPERVISION_LEVELS,
  CONTACT_OUTCOMES,
  CHILD_MOODS,
} from "@/lib/services/contact-monitoring-service";
import type {
  ContactType,
  ContactOutcome,
} from "@/lib/services/contact-monitoring-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "contact_types") return NextResponse.json({ ok: true, data: CONTACT_TYPES });
  if (type === "supervision_levels") return NextResponse.json({ ok: true, data: SUPERVISION_LEVELS });
  if (type === "contact_outcomes") return NextResponse.json({ ok: true, data: CONTACT_OUTCOMES });
  if (type === "child_moods") return NextResponse.json({ ok: true, data: CHILD_MOODS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listSessions(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    contactType: (searchParams.get("contactType") ?? undefined) as ContactType | undefined,
    outcome: (searchParams.get("outcome") ?? undefined) as ContactOutcome | undefined,
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

  if (action === "create_session") {
    const result = await createSession(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_session") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateSession(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
