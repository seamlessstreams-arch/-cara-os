import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { CaraAssessmentStatus } from "@/types/extended";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const assessment = intelligenceDb.caraAssessments.findById(id);
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  return NextResponse.json({ data: assessment });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json() as {
    status?: CaraAssessmentStatus;
    human_reviewed_text?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    approved_by?: string;
    approved_at?: string;
    situation_summary?: string;
    risk_level?: string;
    safeguarding_flags?: string[];
    protective_factors?: string[];
    emotional_needs?: string[];
    suggested_actions?: unknown[];
  };

  const existing = intelligenceDb.caraAssessments.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.human_reviewed_text !== undefined) patch.human_reviewed_text = body.human_reviewed_text;
  if (body.reviewed_by !== undefined) patch.reviewed_by = body.reviewed_by;
  if (body.reviewed_at !== undefined) patch.reviewed_at = body.reviewed_at;
  if (body.approved_by !== undefined) patch.approved_by = body.approved_by;
  if (body.approved_at !== undefined) patch.approved_at = body.approved_at;
  if (body.situation_summary !== undefined) patch.situation_summary = body.situation_summary;
  if (body.risk_level !== undefined) patch.risk_level = body.risk_level;
  if (body.safeguarding_flags !== undefined) patch.safeguarding_flags = body.safeguarding_flags;
  if (body.protective_factors !== undefined) patch.protective_factors = body.protective_factors;
  if (body.emotional_needs !== undefined) patch.emotional_needs = body.emotional_needs;
  if (body.suggested_actions !== undefined) patch.suggested_actions = body.suggested_actions;

  const updated = intelligenceDb.caraAssessments.patch(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (body.status === "reviewed") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: body.reviewed_by ?? "unknown",
      child_id: updated.child_id,
      action_type: "cara_assessment_reviewed",
      source_table: "cara_assessments",
      source_id: id,
    });
  } else if (body.status === "approved") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: body.approved_by ?? "unknown",
      child_id: updated.child_id,
      action_type: "cara_assessment_approved",
      source_table: "cara_assessments",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
