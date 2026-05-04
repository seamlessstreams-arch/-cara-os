import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { LiversAnalysis } from "@/types/extended";
import { canPerformLiversAction, resolveLiversRole } from "@/lib/livers-access";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId = searchParams.get("home_id") ?? "home_oak";

  const results = childId
    ? intelligenceDb.liversAnalyses.findByChild(childId)
    : intelligenceDb.liversAnalyses.findAll(homeId);

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<LiversAnalysis> & { user_role?: string };
  const role = resolveLiversRole(req, body.user_role);

  if (!canPerformLiversAction(role, "analysis:create")) {
    return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
  }

  if (!body.child_id) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  const record = intelligenceDb.liversAnalyses.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id,
    linked_record_id: body.linked_record_id,
    linked_record_type: body.linked_record_type,
    lived_experience_summary: body.lived_experience_summary,
    immediate_cumulative_risk: body.immediate_cumulative_risk,
    risk_pattern: body.risk_pattern,
    viability_of_change: body.viability_of_change,
    viability_rating: body.viability_rating,
    environment_system_forces: body.environment_system_forces,
    relational_psychological_drivers: body.relational_psychological_drivers,
    sustainability_independence_safety: body.sustainability_independence_safety,
    sustainability_rating: body.sustainability_rating,
    aria_summary: body.aria_summary,
    aria_confidence: body.aria_confidence,
    recommended_intervention_type: body.recommended_intervention_type,
    escalation_required: body.escalation_required ?? false,
    escalation_actions: body.escalation_actions ?? [],
    management_oversight: body.management_oversight,
    quality_check_passed: body.quality_check_passed ?? false,
    quality_check_notes: body.quality_check_notes,
    status: body.status ?? "draft",
    review_date: body.review_date,
    created_by: body.created_by ?? "staff_darren",
    reviewed_by: body.reviewed_by,
    approved_by: body.approved_by,
    reviewed_at: body.reviewed_at,
    approved_at: body.approved_at,
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
