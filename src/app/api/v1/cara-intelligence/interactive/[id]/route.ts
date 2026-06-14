import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = intelligenceDb.interactiveSessions.findById(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ data: session });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.interactiveSessions.findById(id);
  if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const allowed = ["responses","child_voice","staff_notes","cara_summary","status","safeguarding_flags","follow_up_actions","completed_at","consent_notes"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.interactiveSessions.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (body.status === "completed") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: updated.created_by,
      child_id: updated.child_id,
      action_type: "interactive_session_completed",
      source_table: "interactive_sessions",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
