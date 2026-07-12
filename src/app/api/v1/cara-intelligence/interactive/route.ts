import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { InteractiveSession, InteractiveSessionMode, InteractiveSessionStatus } from "@/types/extended";
import { readJsonBody } from "@/lib/http/read-json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const homeId  = searchParams.get("home_id") ?? "home_oak";

  const results = childId
    ? intelligenceDb.interactiveSessions.findByChild(childId)
    : intelligenceDb.interactiveSessions.findAll(homeId);

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  let body: Partial<InteractiveSession>;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.child_id) return NextResponse.json({ error: "Missing required field: child_id" }, { status: 400 });
  if (body.consent_recorded === undefined) return NextResponse.json({ error: "Missing required field: consent_recorded" }, { status: 400 });

  const session = intelligenceDb.interactiveSessions.create({
    home_id:              body.home_id ?? "home_oak",
    child_id:             body.child_id,
    key_work_session_id:  body.key_work_session_id,
    consent_recorded:     body.consent_recorded,
    consent_notes:        body.consent_notes,
    session_mode:         (body.session_mode as InteractiveSessionMode) ?? "guided",
    responses:            body.responses ?? [],
    child_voice:          body.child_voice,
    staff_notes:          body.staff_notes,
    cara_summary:         body.cara_summary,
    safeguarding_flags:   body.safeguarding_flags ?? [],
    follow_up_actions:    body.follow_up_actions ?? [],
    status:               (body.status as InteractiveSessionStatus) ?? "active",
    created_by:           body.created_by ?? "staff_darren",
    completed_at:         body.completed_at,
  });

  return NextResponse.json({ data: session }, { status: 201 });
}
