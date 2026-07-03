import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRiskAssessments,
  getRiskAssessment,
  createRiskAssessment,
  updateRiskAssessment,
  reviewRiskAssessment,
  RISK_CATEGORIES,
} from "@/lib/services/risk-assessment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Static constants (no DB)
  if (type === "categories") {
    return NextResponse.json({ ok: true, data: RISK_CATEGORIES });
  }

  // Single assessment
  const id = searchParams.get("id");
  if (id) {
    const result = await getRiskAssessment(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // List assessments
  const result = await listRiskAssessments(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    category: searchParams.get("category") as "self_harm" | "exploitation" ?? undefined,
    status: searchParams.get("status") as "active" | "closed" ?? undefined,
    riskLevel: searchParams.get("riskLevel") as "very_high" | "high" ?? undefined,
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

    if (action === "create") {
      const result = await createRiskAssessment({
        homeId,
        childId: body.childId,
        category: body.category,
        title: body.title,
        description: body.description,
        likelihood: body.likelihood,
        impact: body.impact,
        mitigations: body.mitigations ?? [],
        triggers: body.triggers ?? [],
        protectiveFactors: body.protectiveFactors ?? [],
        assessorId: body.assessorId,
        nextReviewDate: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateRiskAssessment(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "review") {
      const { id, reviewerId, nextReviewDate } = body;
      if (!id || !reviewerId) return NextResponse.json({ error: "id and reviewerId required" }, { status: 400 });
      const result = await reviewRiskAssessment(id, reviewerId, nextReviewDate);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, or review" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
