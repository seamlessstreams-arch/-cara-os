import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { CaraAssessment, CaraAssessmentType, CaraRiskLevel, CaraConfidenceLevel, CaraAssessmentStatus } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId = searchParams.get("home_id") ?? "home_oak";

  let results: CaraAssessment[];

  if (childId) {
    results = intelligenceDb.caraAssessments.findByChild(childId);
  } else {
    results = intelligenceDb.caraAssessments.findAll(homeId);
  }

  return NextResponse.json({
    data: results,
    meta: { total: results.length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<CaraAssessment>;

  const required = ["child_id", "assessment_type", "ai_generated_text"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validTypes: CaraAssessmentType[] = ["situation_review", "pattern_scan", "safeguarding_scan", "reflective_debrief"];
  if (!validTypes.includes(body.assessment_type as CaraAssessmentType)) {
    return NextResponse.json({ error: `assessment_type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  const assessment = intelligenceDb.caraAssessments.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    source_record_type: body.source_record_type,
    source_record_id: body.source_record_id,
    assessment_type: body.assessment_type as CaraAssessmentType,
    situation_summary: body.situation_summary,
    risk_level: (body.risk_level as CaraRiskLevel) ?? "not_identified",
    safeguarding_flags: body.safeguarding_flags ?? [],
    protective_factors: body.protective_factors ?? [],
    emotional_needs: body.emotional_needs ?? [],
    suggested_actions: body.suggested_actions ?? [],
    confidence_level: (body.confidence_level as CaraConfidenceLevel) ?? "needs_human_review",
    ai_generated_text: body.ai_generated_text!,
    human_reviewed_text: body.human_reviewed_text,
    status: (body.status as CaraAssessmentStatus) ?? "draft",
    created_by: body.created_by ?? "staff_darren",
    reviewed_by: body.reviewed_by,
    approved_by: body.approved_by,
    reviewed_at: body.reviewed_at,
    approved_at: body.approved_at,
  });

  intelligenceDb.caraAuditTrail.create({
    home_id: assessment.home_id,
    user_id: assessment.created_by,
    child_id: assessment.child_id,
    action_type: "aria_assessment_created",
    source_table: "aria_assessments",
    source_id: assessment.id,
  });

  return NextResponse.json({ data: assessment }, { status: 201 });
}
