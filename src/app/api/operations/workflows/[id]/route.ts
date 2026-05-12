import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  getWorkflow, completeWorkflowStep,
  skipWorkflowStep, cancelWorkflow,
} from "@/lib/services/workflow-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: null, persisted: false });
  }

  const result = await getWorkflow(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, userId, stepId, completion_notes, evidence_ids, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    switch (action) {
      case "complete_step": {
        if (!stepId) return NextResponse.json({ error: "stepId is required" }, { status: 400 });
        const result = await completeWorkflowStep(stepId, userId, { completion_notes, evidence_ids });
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      case "skip_step": {
        if (!stepId || !reason) return NextResponse.json({ error: "stepId and reason required" }, { status: 400 });
        const result = await skipWorkflowStep(stepId, userId, reason);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      case "cancel": {
        const result = await cancelWorkflow(id, userId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
