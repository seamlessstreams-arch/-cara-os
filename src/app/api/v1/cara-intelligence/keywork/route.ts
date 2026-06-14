import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { KeyWorkSession, KeyWorkTheme, KeyWorkSessionStatus } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId  = searchParams.get("home_id") ?? "home_oak";
  const status  = searchParams.get("status");

  let results = childId
    ? intelligenceDb.keyWorkSessions.findByChild(childId)
    : intelligenceDb.keyWorkSessions.findAll(homeId);

  if (status) results = results.filter((s) => s.status === status);

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  let body: Partial<KeyWorkSession>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const required = ["child_id","title","theme","reason","aims","desired_outcomes"] as const;
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
  }

  const session = intelligenceDb.keyWorkSessions.create({
    home_id:         body.home_id ?? "home_oak",
    child_id:        body.child_id!,
    title:           body.title!,
    theme:           body.theme as KeyWorkTheme,
    reason:          body.reason!,
    aims:            body.aims!,
    desired_outcomes:body.desired_outcomes!,
    session_plan:    body.session_plan ?? null,
    resources:       body.resources ?? [],
    child_voice:     body.child_voice,
    staff_reflection:body.staff_reflection,
    cara_summary:    body.cara_summary,
    manager_oversight_id: body.manager_oversight_id,
    status:          (body.status as KeyWorkSessionStatus) ?? "planned",
    created_by:      body.created_by ?? "staff_darren",
    completed_by:    body.completed_by,
    reviewed_by:     body.reviewed_by,
    completed_at:    body.completed_at,
    reviewed_at:     body.reviewed_at,
  });

  intelligenceDb.caraAuditTrail.create({
    home_id:      session.home_id,
    user_id:      session.created_by,
    child_id:     session.child_id,
    action_type:  "keywork_session_created",
    source_table: "key_work_sessions",
    source_id:    session.id,
  });

  return NextResponse.json({ data: session }, { status: 201 });
}
