import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { LiversOutcomeRecord } from "@/types/extended";
import { canPerformLiversAction, resolveLiversRole } from "@/lib/livers-access";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  const childId = searchParams.get("child_id");

  const results = sessionId
    ? intelligenceDb.interventionOutcomes.findBySession(sessionId)
    : childId
    ? intelligenceDb.interventionOutcomes.findByChild(childId)
    : [];

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Partial<LiversOutcomeRecord> & { user_role?: string };
  const role = await resolveLiversRole(req, body.user_role);

  if (!canPerformLiversAction(role, "outcome:create")) {
    return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
  }

  if (!body.intervention_session_id || !body.child_id) {
    return NextResponse.json(
      { error: "intervention_session_id and child_id are required" },
      { status: 400 }
    );
  }

  const record = intelligenceDb.interventionOutcomes.create({
    home_id: body.home_id ?? "home_oak",
    intervention_session_id: body.intervention_session_id,
    child_id: body.child_id,
    child_response: body.child_response,
    what_worked: body.what_worked,
    what_did_not_work: body.what_did_not_work,
    emotional_presentation: body.emotional_presentation,
    risk_change: body.risk_change ?? "unknown",
    sustainability_change: body.sustainability_change ?? "unknown",
    further_action_required: body.further_action_required ?? false,
    further_action_notes: body.further_action_notes,
    management_review: body.management_review ?? false,
    management_review_notes: body.management_review_notes,
    follow_up_sessions_needed: body.follow_up_sessions_needed,
    created_by: body.created_by ?? "staff_darren",
  });

  // Update the session status to completed if not already
  intelligenceDb.interventionSessions.patch(body.intervention_session_id, {
    status: "completed",
    child_response: body.child_response,
    risk_change: body.risk_change ?? "unknown",
    sustainability_change: body.sustainability_change ?? "unknown",
    further_action_required: body.further_action_required ?? false,
    completed_at: new Date().toISOString(),
    completed_by: body.created_by,
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
