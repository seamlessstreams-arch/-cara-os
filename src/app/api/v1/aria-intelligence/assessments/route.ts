import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { AriaAssessment, AriaAssessmentType, AriaRiskLevel, AriaConfidenceLevel, AriaAssessmentStatus } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId = searchParams.get("home_id") ?? "home_oak";

  let results: AriaAssessment[];

  if (childId) {
    results = intelligenceDb.ariaAssessments.findByChild(childId);
  } else {
    results = intelligenceDb.ariaAssessments.findAll(homeId);
  }

  return NextResponse.json({
    data: results,
    meta: { total: results.length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<AriaAssessment>;

  const required = ["child_id", "assessment_type", "ai_generated_text"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validTypes: AriaAssessmentType[] = ["situation_review", "pattern_scan", "safeguarding_scan", "reflective_debrief"];
  if (!validTypes.includes(body.assessment_type as AriaAssessmentType)) {
    return NextResponse.json({ error: `assessment_type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  const assessment = intelligenceDb.ariaAssessments.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    source_record_type: body.source_record_type,
    source_record_id: body.source_record_id,
    assessment_type: body.assessment_type as AriaAssessmentType,
    situation_summary: body.situation_summary,
    risk_level: (body.risk_level as AriaRiskLevel) ?? "not_identified",
    safeguarding_flags: body.safeguarding_flags ?? [],
    protective_factors: body.protective_factors ?? [],
    emotional_needs: body.emotional_needs ?? [],
    suggested_actions: body.suggested_actions ?? [],
    confidence_level: (body.confidence_level as AriaConfidenceLevel) ?? "needs_human_review",
    ai_generated_text: body.ai_generated_text!,
    human_reviewed_text: body.human_reviewed_text,
    status: (body.status as AriaAssessmentStatus) ?? "draft",
    created_by: body.created_by ?? "staff_darren",
    reviewed_by: body.reviewed_by,
    approved_by: body.approved_by,
    reviewed_at: body.reviewed_at,
    approved_at: body.approved_at,
  });

  intelligenceDb.ariaAuditTrail.create({
    home_id: assessment.home_id,
    user_id: assessment.created_by,
    child_id: assessment.child_id,
    action_type: "aria_assessment_created",
    source_table: "aria_assessments",
    source_id: assessment.id,
  });

  return NextResponse.json({ data: assessment }, { status: 201 });
}
