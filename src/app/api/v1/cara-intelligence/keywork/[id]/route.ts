import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { readJsonBody } from "@/lib/http/read-json";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = intelligenceDb.keyWorkSessions.findById(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ data: session });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.keyWorkSessions.findById(id);
  if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const allowed = ["status","session_plan","resources","child_voice","staff_reflection","cara_summary","completed_by","completed_at","reviewed_by","reviewed_at","manager_oversight_id","title","theme","reason","aims","desired_outcomes"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.keyWorkSessions.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (body.status === "completed") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: (body.completed_by as string) ?? "staff_darren",
      child_id: updated.child_id,
      action_type: "keywork_session_completed",
      source_table: "key_work_sessions",
      source_id: id,
    });
  } else if (body.status === "reviewed") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: (body.reviewed_by as string) ?? "staff_darren",
      child_id: updated.child_id,
      action_type: "keywork_session_reviewed",
      source_table: "key_work_sessions",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
