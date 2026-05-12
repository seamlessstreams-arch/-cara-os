import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { listTasks, createTask, getTaskStats } from "@/lib/services/task-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Stats endpoint
  if (searchParams.get("stats") === "true") {
    const result = await getTaskStats(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  const status = searchParams.get("status");
  const statusArray = status?.includes(",") ? status.split(",") : undefined;

  const result = await listTasks(homeId, {
    status: statusArray ? statusArray as any : status as any ?? undefined,
    category: searchParams.get("category") as any ?? undefined,
    priority: searchParams.get("priority") as any ?? undefined,
    assigned_to: searchParams.get("assigned_to") ?? undefined,
    linked_child_id: searchParams.get("childId") ?? undefined,
    overdue_only: searchParams.get("overdue") === "true",
    limit: parseInt(searchParams.get("limit") ?? "100"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, title, category, created_by, ...rest } = body;

    if (!homeId || !title || !category || !created_by) {
      return NextResponse.json({ error: "homeId, title, category, and created_by are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const result = await createTask({ homeId, title, category, created_by, ...rest });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
