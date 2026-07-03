import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listKeyWorkSessions,
  getKeyWorkSession,
  createKeyWorkSession,
  updateKeyWorkSession,
  completeSession,
  THERAPEUTIC_FRAMEWORKS,
  KEY_WORK_TOPICS,
  SESSION_FREQUENCY,
} from "@/lib/services/key-working-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "frameworks") {
    return NextResponse.json({ ok: true, data: THERAPEUTIC_FRAMEWORKS });
  }
  if (type === "topics") {
    return NextResponse.json({ ok: true, data: KEY_WORK_TOPICS });
  }
  if (type === "frequency") {
    return NextResponse.json({ ok: true, data: SESSION_FREQUENCY });
  }

  const id = searchParams.get("id");
  if (id) {
    const result = await getKeyWorkSession(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listKeyWorkSessions(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    keyWorkerId: searchParams.get("keyWorkerId") ?? undefined,
    sessionType: searchParams.get("sessionType") as "one_to_one" ?? undefined,
    status: searchParams.get("status") as "planned" | "completed" ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create") {
      const result = await createKeyWorkSession({
        homeId,
        childId: body.childId,
        keyWorkerId: body.keyWorkerId,
        sessionType: body.sessionType ?? "one_to_one",
        therapeuticFramework: body.therapeuticFramework ?? "none",
        plannedDate: body.plannedDate,
        location: body.location,
        topics: body.topics ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateKeyWorkSession(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "complete") {
      const { id, ...completionData } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await completeSession(id, completionData);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, or complete" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
