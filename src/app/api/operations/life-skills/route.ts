import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSkillAssessments,
  createSkillAssessment,
  listPathwayPlans,
  createPathwayPlan,
  updatePathwayPlan,
  SKILL_DOMAINS,
  COMPETENCY_LEVELS,
  PATHWAY_PLAN_STATUS,
} from "@/lib/services/life-skills-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "skill_domains") {
    return NextResponse.json({ ok: true, data: SKILL_DOMAINS });
  }
  if (type === "competency_levels") {
    return NextResponse.json({ ok: true, data: COMPETENCY_LEVELS });
  }
  if (type === "pathway_statuses") {
    return NextResponse.json({ ok: true, data: PATHWAY_PLAN_STATUS });
  }

  // Pathway plans
  if (type === "pathway_plans") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listPathwayPlans(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Skill assessments (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listSkillAssessments(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    domain: searchParams.get("domain") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_assessment") {
      const result = await createSkillAssessment({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        domain: body.domain,
        skill: body.skill,
        competency_level: body.competencyLevel ?? "not_assessed",
        assessed_date: body.assessedDate,
        assessed_by: body.assessedBy,
        notes: body.notes,
        evidence: body.evidence,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_pathway_plan") {
      const result = await createPathwayPlan({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        status: body.status ?? "not_started",
        start_date: body.startDate,
        target_move_date: body.targetMoveDate,
        accommodation_plan: body.accommodationPlan,
        education_employment_plan: body.educationEmploymentPlan,
        support_network: body.supportNetwork,
        personal_adviser_name: body.personalAdviserName,
        last_reviewed: body.lastReviewed,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_pathway_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePathwayPlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_assessment, create_pathway_plan, or update_pathway_plan" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
