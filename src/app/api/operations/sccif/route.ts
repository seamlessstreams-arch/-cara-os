import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSelfEvaluations,
  createSelfEvaluation,
  updateSelfEvaluation,
  listEvidenceEntries,
  createEvidenceEntry,
  SCCIF_JUDGMENTS,
  JUDGMENT_GRADES,
  SCCIF_EVIDENCE_AREAS,
} from "@/lib/services/sccif-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "judgments") {
    return NextResponse.json({ ok: true, data: SCCIF_JUDGMENTS });
  }
  if (type === "grades") {
    return NextResponse.json({ ok: true, data: JUDGMENT_GRADES });
  }
  if (type === "evidence_areas") {
    return NextResponse.json({ ok: true, data: SCCIF_EVIDENCE_AREAS });
  }

  // Evidence entries
  if (type === "evidence") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listEvidenceEntries(homeId, {
      evaluationId: searchParams.get("evaluationId") ?? undefined,
      evidenceArea: searchParams.get("evidenceArea") ?? undefined,
      gradeIndicator: searchParams.get("gradeIndicator") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Self evaluations (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listSelfEvaluations(homeId, {
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_evaluation") {
      const result = await createSelfEvaluation({
        homeId,
        periodFrom: body.periodFrom,
        periodTo: body.periodTo,
        status: body.status ?? "draft",
        overallGrade: body.overallGrade,
        helpedProtectedGrade: body.helpedProtectedGrade,
        leadershipGrade: body.leadershipGrade,
        strengths: body.strengths ?? [],
        areasForImprovement: body.areasForImprovement ?? [],
        createdBy: body.createdBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_evaluation") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateSelfEvaluation(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_evidence") {
      const result = await createEvidenceEntry({
        homeId,
        evaluationId: body.evaluationId,
        evidenceArea: body.evidenceArea,
        description: body.description ?? "",
        dataSource: body.dataSource,
        metricValue: body.metricValue,
        metricLabel: body.metricLabel,
        gradeIndicator: body.gradeIndicator ?? "neutral",
        regulationReference: body.regulationReference,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_evaluation, update_evaluation, or create_evidence" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
