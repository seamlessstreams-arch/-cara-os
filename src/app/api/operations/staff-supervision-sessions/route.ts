import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSessions,
  createSession,
  updateSession,
  SUPERVISION_TYPES,
  SESSION_STATUSES,
  WELLBEING_RATINGS,
  ACTION_PRIORITIES,
} from "@/lib/services/staff-supervision-sessions-service";
import type {
  SupervisionType,
  SessionStatus,
} from "@/lib/services/staff-supervision-sessions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "supervision_types") return NextResponse.json({ ok: true, data: SUPERVISION_TYPES });
  if (type === "session_statuses") return NextResponse.json({ ok: true, data: SESSION_STATUSES });
  if (type === "wellbeing_ratings") return NextResponse.json({ ok: true, data: WELLBEING_RATINGS });
  if (type === "action_priorities") return NextResponse.json({ ok: true, data: ACTION_PRIORITIES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listSessions(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    supervisionType: (searchParams.get("supervisionType") ?? undefined) as SupervisionType | undefined,
    sessionStatus: (searchParams.get("sessionStatus") ?? undefined) as SessionStatus | undefined,
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
