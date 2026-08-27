import { readJsonBody } from "@/lib/http/read-json";
import { enumParam, enumParamList } from "@/lib/http/enum-param";
import {
  CS_TASK_STATUS_VALUES,
  CS_TASK_CATEGORY_VALUES,
  CS_TASK_PRIORITY_VALUES,
} from "@/types/operations";
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

  // These three used to be cast straight into their unions, so `?status=Done`
  // filtered on a value no task can hold and the list came back empty — which
  // reads as "nothing to do" rather than "that filter is wrong".
  const rawStatus = searchParams.get("status");
  const statusResult = rawStatus?.includes(",")
    ? enumParamList("status", rawStatus.split(","), CS_TASK_STATUS_VALUES)
    : enumParam("status", rawStatus, CS_TASK_STATUS_VALUES);
  if (!statusResult.ok) return statusResult.response;

  const category = enumParam("category", searchParams.get("category"), CS_TASK_CATEGORY_VALUES);
  if (!category.ok) return category.response;

  const priority = enumParam("priority", searchParams.get("priority"), CS_TASK_PRIORITY_VALUES);
  if (!priority.ok) return priority.response;

  const result = await listTasks(homeId, {
    status: statusResult.value,
    category: category.value,
    priority: priority.value,
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
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
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
