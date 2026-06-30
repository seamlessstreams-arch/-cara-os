import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  listTasks,
  createTask,
  INDUCTION_CATEGORIES,
  INDUCTION_TASK_STATUSES,
  PROBATION_STATUSES,
  PROBATION_MILESTONES,
} from "@/lib/services/staff-induction-service";
import type {
  ProbationStatus,
  InductionCategory,
  InductionTaskStatus,
} from "@/lib/services/staff-induction-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "induction_categories") {
    return NextResponse.json({ ok: true, data: INDUCTION_CATEGORIES });
  }
  if (type === "task_statuses") {
    return NextResponse.json({ ok: true, data: INDUCTION_TASK_STATUSES });
  }
  if (type === "probation_statuses") {
    return NextResponse.json({ ok: true, data: PROBATION_STATUSES });
  }
  if (type === "probation_milestones") {
    return NextResponse.json({ ok: true, data: PROBATION_MILESTONES });
  }

  // Tasks
  if (type === "tasks") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listTasks(homeId, {
      inductionId: searchParams.get("inductionId") ?? undefined,
      category: (searchParams.get("category") ?? undefined) as InductionCategory | undefined,
      status: (searchParams.get("status") ?? undefined) as InductionTaskStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Records (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    probationStatus: (searchParams.get("probationStatus") ?? undefined) as ProbationStatus | undefined,
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
  if (action === "create_task") {
    const result = await createTask(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
