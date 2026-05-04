import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { InterventionSession } from "@/types/extended";
import { canPerformLiversAction, resolveLiversRole } from "@/lib/livers-access";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId = searchParams.get("home_id") ?? "home_oak";
  const liversId = searchParams.get("livers_id");

  let results: InterventionSession[];
  if (liversId) {
    results = intelligenceDb.interventionSessions.findByLivers(liversId);
  } else if (childId) {
    results = intelligenceDb.interventionSessions.findByChild(childId);
  } else {
    results = intelligenceDb.interventionSessions.findAll(homeId);
  }

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<InterventionSession> & { user_role?: string };
  const role = resolveLiversRole(req, body.user_role);

  if (!canPerformLiversAction(role, "session:create")) {
    return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
  }

  if (!body.child_id || !body.title || !body.session_type) {
    return NextResponse.json(
      { error: "child_id, title, and session_type are required" },
      { status: 400 }
    );
  }

  const record = intelligenceDb.interventionSessions.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id,
    livers_analysis_id: body.livers_analysis_id,
    linked_keywork_session_id: body.linked_keywork_session_id,
    title: body.title,
    session_type: body.session_type,
    reason_for_session: body.reason_for_session,
    aim: body.aim,
    staff_preparation: body.staff_preparation,
    emotional_safety_notes: body.emotional_safety_notes,
    pace_opening_script: body.pace_opening_script,
    session_steps: body.session_steps ?? [],
    child_friendly_version: body.child_friendly_version,
    reflective_questions_child: body.reflective_questions_child ?? [],
    reflective_questions_staff: body.reflective_questions_staff ?? [],
    resources_generated: body.resources_generated ?? [],
    follow_up_actions: body.follow_up_actions ?? [],
    management_oversight_note: body.management_oversight_note,
    evidence_refs: body.evidence_refs ?? [],
    outcome: body.outcome,
    outcome_summary: body.outcome_summary,
    child_response: body.child_response,
    risk_change: body.risk_change,
    sustainability_change: body.sustainability_change,
    further_action_required: body.further_action_required ?? false,
    style_professional: body.style_professional,
    style_management_oversight: body.style_management_oversight,
    style_child_friendly: body.style_child_friendly,
    style_reflective_supervision: body.style_reflective_supervision,
    style_social_worker_update: body.style_social_worker_update,
    style_ofsted_ready: body.style_ofsted_ready,
    quality_check_passed: body.quality_check_passed ?? false,
    quality_check_notes: body.quality_check_notes ?? {},
    status: body.status ?? "draft",
    review_date: body.review_date,
    created_by: body.created_by ?? "staff_darren",
    completed_by: body.completed_by,
    reviewed_by: body.reviewed_by,
    approved_by: body.approved_by,
    completed_at: body.completed_at,
    reviewed_at: body.reviewed_at,
    approved_at: body.approved_at,
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
