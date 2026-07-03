import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { escalateTask, delegateTask } from "@/lib/services/task-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { userId, action, escalateTo, delegateTo, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "delegate") {
      if (!delegateTo) {
        return NextResponse.json({ error: "delegateTo is required" }, { status: 400 });
      }
      const result = await delegateTask(id, userId, delegateTo);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // default: escalate
    if (!escalateTo || !reason) {
      return NextResponse.json({ error: "escalateTo and reason are required" }, { status: 400 });
    }
    const result = await escalateTask(id, userId, escalateTo, reason);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
